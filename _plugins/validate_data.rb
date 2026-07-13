# Build-time validation of the _data/*.yml content files.
#
# Why: the whole site is data-driven, and contributors edit YAML on github.com
# without a local build. This plugin turns the most common content mistakes
# (a missing required field, a typo'd image filename, a bad date, an unknown
# news category) into a clear, human-readable build failure naming the file,
# the entry, and the fix -- instead of a silently broken page on the live site.
#
# It runs first (priority :highest) under `bundle exec jekyll build`, before any
# page is generated, and aggregates every problem so a contributor sees all of
# them at once. A warning (e.g. a journal with no logo, which the template
# legitimately hides) is logged but does not fail the build.
#
# Adding a field/file? Keep this in sync so the guard stays meaningful.
module SAIL
  class DataValidator < Jekyll::Generator
    safe true
    priority :highest

    DATE_RE  = /\A\d{4}-\d{2}-\d{2}\z/
    SLUG_RE  = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
    NEWS_CATS = %w[people publication award talk event].freeze

    def generate(site)
      @site   = site
      @src    = site.source
      @errors = []
      @warns  = []

      validate_people(site.data["people"], "people.yml", "person")
      validate_themes(site.data["themes"])
      validate_publications(site.data["publications"])
      validate_news(site.data["news"])
      validate_covers(site.data["covers"], site.data["publications"])
      validate_research(site.data["research"])
      validate_photos(site.data["photos"])
      validate_navigation(site.data["navigation"])
      validate_pi(site.data["pi"])
      validate_home(site.data["home"])
      validate_positions(site.data["positions"])
      validate_journal_logos(site.data["journal_logos"])
      warn_unused_themes(site.data["themes"], site.data["publications"])

      # Member/alumni external-publication files, plus a heads-up for an orphan file
      # (a member_pubs/<slug>.yml whose slug matches no one in people.yml, so it
      # renders nowhere -- a warning, not a hard error).
      people_slugs = (site.data["people"] || []).map { |p| p["slug"].to_s }
      (site.data["member_pubs"] || {}).each do |slug, pubs|
        unless people_slugs.include?(slug.to_s)
          warn("member_pubs/#{slug}.yml has no matching person (slug \"#{slug}\") in people.yml; it will not appear anywhere.")
        end
        validate_person_pubs(pubs, "member_pubs/#{slug}.yml")
      end

      @warns.each { |w| Jekyll.logger.warn "Data check:", w }
      return if @errors.empty?

      banner = "\n" + ("=" * 72) + "\n" \
        "SAIL data validation failed (#{@errors.size} problem(s)).\n" \
        "Fix the _data/*.yml entries below, then commit again.\n" +
        ("=" * 72) + "\n  - " + @errors.join("\n  - ") + "\n" + ("=" * 72)
      Jekyll.logger.error "Data check:", banner
      raise Jekyll::Errors::FatalException, "SAIL data validation failed (#{@errors.size} problem(s)); see the list above."
    end

    private

    def err(msg);  @errors << msg; end
    def warn(msg); @warns  << msg; end

    def blank?(v)
      return true if v.nil?
      return v.strip.empty? if v.is_a?(String)
      false # numbers, dates, etc. are not "blank"
    end

    def image_exists?(rel)
      File.file?(File.join(@src, "assets", "images", rel))
    end

    # --- members / alumni ---------------------------------------------------
    def validate_people(list, file, kind)
      return if list.nil?
      unless list.is_a?(Array)
        err("#{file}: expected a list of #{kind} entries.")
        return
      end
      seen_slugs = {}
      list.each_with_index do |p, i|
        at = "#{file} entry #{i + 1}"
        name = p["name"]
        at = "#{file} \"#{name}\"" unless blank?(name)
        err("#{at}: missing required field `name`.") if blank?(name)
        err("#{at}: missing required field `role`.") if blank?(p["role"])
        unless %w[current alumni].include?(p["status"])
          err("#{at}: `status` must be `current` or `alumni` (got #{p["status"].inspect}).")
        end

        if !blank?(p["photo"]) && !image_exists?(File.join("people", p["photo"]))
          err("#{at}: `photo: #{p["photo"]}` not found in assets/images/people/.")
        end
        # Optional second photo that crossfades in on hover (person-card.html).
        if !blank?(p["photo_hover"]) && !image_exists?(File.join("people", p["photo_hover"]))
          err("#{at}: `photo_hover: #{p["photo_hover"]}` not found in assets/images/people/.")
        end
        # Optional short bio shown on the personal page; must be one text block
        # (a YAML list here would render as run-together text, so fail loudly).
        if !p["description"].nil? && !p["description"].is_a?(String)
          err("#{at}: `description` must be a single text block, not a list (use `description: >` followed by indented lines).")
        end
        unless blank?(p["slug"])
          slug = p["slug"]
          err("#{at}: `slug: #{slug}` must be lowercase letters/numbers/hyphens.") unless slug =~ SLUG_RE
          if seen_slugs[slug]
            err("#{at}: duplicate `slug: #{slug}` (also used by #{seen_slugs[slug]}).")
          else
            seen_slugs[slug] = (blank?(name) ? at : name)
          end
        end
        err("#{at}: `email` looks invalid (no '@'): #{p["email"]}") if !blank?(p["email"]) && !p["email"].to_s.include?("@")
        %w[linkedin github scholar orcid website].each do |f|
          err("#{at}: `#{f}` should be a full URL (http...), got: #{p[f]}") if !blank?(p[f]) && !p[f].to_s.start_with?("http")
        end
        if !blank?(p["joined"]) && !(p["joined"].to_s =~ DATE_RE)
          err("#{at}: `joined: #{p["joined"]}` must be YYYY-MM-DD.")
        end
        validate_person_pubs(p["publications"], at)
      end
    end

    # A member/alumnus may list their own external papers under `publications:`.
    def validate_person_pubs(pubs, at)
      return if pubs.nil?
      unless pubs.is_a?(Array)
        err("#{at}: `publications` must be a list of papers.")
        return
      end
      pubs.each_with_index do |pub, j|
        pat = "#{at} publication #{j + 1}"
        %w[title authors journal year].each do |f|
          err("#{pat}: missing required field `#{f}`.") if blank?(pub[f])
        end
        if !blank?(pub["year"]) && !pub["year"].is_a?(Integer)
          err("#{pat}: `year` must be a plain number with no quotes (year: 2023), got #{pub["year"].inspect}.")
        end
        %w[doi preprint_url].each do |f|
          err("#{pat}: `#{f}` should be a full URL (http...), got: #{pub[f]}") if !blank?(pub[f]) && !pub[f].to_s.start_with?("http")
        end
        if !blank?(pub["image"]) && !image_exists?(File.join("pubs", pub["image"]))
          err("#{pat}: `image: #{pub["image"]}` not found in assets/images/pubs/.")
        end
      end
    end

    # --- publications -------------------------------------------------------
    def validate_publications(list)
      return if list.nil?
      unless list.is_a?(Array)
        err("publications.yml: expected a list of papers.")
        return
      end
      seen_ids = {}
      list.each_with_index do |p, i|
        id = p["id"]
        at = id.nil? ? "publications.yml entry #{i + 1}" : "publications.yml id #{id}"
        if id.nil?
          err("#{at}: missing required field `id`.")
        elsif !id.is_a?(Integer)
          err("#{at}: `id` must be a whole number, got #{id.inspect}.")
        elsif seen_ids[id]
          err("#{at}: duplicate `id: #{id}`.")
        else
          seen_ids[id] = true
        end

        %w[title authors journal year].each do |f|
          err("#{at}: missing required field `#{f}`.") if blank?(p[f])
        end
        # year must be a plain number; a quoted "2026" mixes types with the other
        # (integer) years and breaks the year grouping/sort on the list page.
        if !blank?(p["year"]) && !p["year"].is_a?(Integer)
          err("#{at}: `year` must be a plain number with no quotes (year: 2026), got #{p["year"].inspect}.")
        end
        if !blank?(p["image"]) && !image_exists?(File.join("pubs", p["image"]))
          err("#{at}: `image: #{p["image"]}` not found in assets/images/pubs/.")
        end
        %w[doi preprint_url].each do |f|
          v = p[f]
          err("#{at}: `#{f}` should be a full URL (http...), got: #{v}") if !blank?(v) && !v.to_s.start_with?("http")
        end
        # A journal with no logo mapping is allowed (the template hides it); warn only.
        logos = @site.data["journal_logos"] || {}
        if !blank?(p["journal"]) && !logos.key?(p["journal"])
          warn("publications.yml id #{id}: journal \"#{p["journal"]}\" has no entry in journal_logos.yml (no logo will show).")
        end
        # Every theme a paper uses must be defined in themes.yml.
        theme_names = (@site.data["themes"] || []).map { |t| t["name"] }
        (p["themes"] || []).each do |t|
          err("#{at}: theme \"#{t}\" is not in _data/themes.yml. If you renamed this theme in themes.yml, rename it here too; otherwise add it to themes.yml or fix the spelling.") unless theme_names.include?(t)
        end
      end
    end

    # --- themes -------------------------------------------------------------
    def validate_themes(list)
      return if list.nil?
      unless list.is_a?(Array)
        err("themes.yml: expected a list of themes.")
        return
      end
      seen = {}
      list.each_with_index do |t, i|
        at = blank?(t["name"]) ? "themes.yml entry #{i + 1}" : "themes.yml \"#{t["name"]}\""
        err("#{at}: missing required field `name`.") if blank?(t["name"])
        if blank?(t["color"])
          err("#{at}: missing required field `color` (a hex like \"#1864ab\").")
        elsif !(t["color"].to_s =~ /\A#[0-9a-fA-F]{6}\z/)
          err("#{at}: `color: #{t["color"]}` must be a 6-digit hex like \"#1864ab\".")
        end
        unless blank?(t["name"])
          err("#{at}: duplicate theme name.") if seen[t["name"]]
          seen[t["name"]] = true
        end
      end
    end

    # A theme defined but used by no paper -- a gentle nudge to prune it (warn only;
    # a theme may be kept intentionally for upcoming work).
    def warn_unused_themes(themes, pubs)
      return unless themes.is_a?(Array) && pubs.is_a?(Array)
      used = {}
      pubs.each { |p| (p["themes"] || []).each { |t| used[t] = true } }
      themes.each do |t|
        next if blank?(t["name"])
        warn("themes.yml: \"#{t["name"]}\" is not used by any paper in publications.yml.") unless used[t["name"]]
      end
    end

    # --- news ---------------------------------------------------------------
    def validate_news(list)
      return if list.nil?
      unless list.is_a?(Array)
        err("news.yml: expected a list of items.")
        return
      end
      list.each_with_index do |n, i|
        title = n["title"]
        at = blank?(title) ? "news.yml entry #{i + 1}" : "news.yml \"#{title}\""
        err("#{at}: missing required field `title`.") if blank?(title)
        if blank?(n["date"])
          err("#{at}: missing required field `date` (YYYY-MM-DD).")
        elsif !n["date"].is_a?(String)
          # an unquoted date is parsed as a Date object and mixes types with the
          # other (string) dates, which breaks the newest-first sort.
          err("#{at}: put quotes around the date, e.g. date: \"2026-06-20\".")
        elsif !(n["date"] =~ DATE_RE)
          err("#{at}: `date: #{n["date"]}` must be YYYY-MM-DD.")
        end
        cat = n["category"]
        if !blank?(cat) && !NEWS_CATS.include?(cat)
          err("#{at}: `category: #{cat}` is not one of #{NEWS_CATS.join(", ")}.")
        end
        # `link` goes into an href; keep it an internal path or a real URL (never a
        # javascript:/data: scheme). The page CSP also blocks javascript: URIs; this
        # closes it at the data layer too.
        link = n["link"]
        if !blank?(link) && !link.to_s.start_with?("/") && !link.to_s.start_with?("http")
          err("#{at}: `link: #{link}` must be an internal path (starts with \"/\") or a full URL (http...).")
        end
      end
    end

    # --- covers -------------------------------------------------------------
    def validate_covers(list, pubs)
      return if list.nil? || !list.is_a?(Array)
      ids = (pubs || []).map { |p| p["id"] }
      list.each_with_index do |c, i|
        at = "covers.yml entry #{i + 1}"
        if blank?(c["image"])
          err("#{at}: missing required field `image`.")
        elsif !image_exists?(c["image"])
          err("#{at}: `image: #{c["image"]}` not found in assets/images/.")
        end
        unless blank?(c["image"])
          full = c["image"].to_s.sub(/\.[^.]+\z/, "") + "-full.jpg"
          err("#{at}: high-res `#{full}` not found in assets/images/ (the fullscreen cover viewer needs it; generate it from the original cover).") unless image_exists?(full)
        end
        pid = c["publication_id"]
        if !pid.nil? && !ids.include?(pid)
          err("#{at}: `publication_id: #{pid}` does not match any paper in publications.yml.")
        end
        %w[w h].each do |dim|
          warn("#{at}: `#{dim}` should be the cover's pixel size (a number) so the layout reserves space.") unless c[dim].is_a?(Integer)
        end
        warn("#{at}: missing `journal`/`year` (shown in the caption and image alt text).") if blank?(c["journal"]) || blank?(c["year"])
      end
    end

    # --- research figures ---------------------------------------------------
    def validate_research(data)
      return if data.nil?
      areas = data["areas"]
      return unless areas.is_a?(Array)
      areas.each_with_index do |a, i|
        at = "research.yml area #{i + 1}"
        at = "#{at} (#{a["title"]})" unless blank?(a["title"])
        err("#{at}: missing required field `title`.") if blank?(a["title"])
        err("#{at}: missing required field `body`.") if blank?(a["body"])
        next if blank?(a["figure"])
        err("#{at}: `figure: #{a["figure"]}` not found in assets/images/.") unless image_exists?(a["figure"])
        %w[figure_w figure_h].each do |dim|
          warn("#{at}: `#{dim}` should be the figure's pixel size (a number) for layout stability.") unless a[dim].is_a?(Integer)
        end
      end
    end

    # --- photos -------------------------------------------------------------
    def validate_photos(list)
      return if list.nil? || !list.is_a?(Array)
      list.each_with_index do |ph, i|
        at = "photos.yml entry #{i + 1}"
        if blank?(ph["image"])
          err("#{at}: missing required field `image`.")
        elsif !image_exists?(ph["image"])
          err("#{at}: `image: #{ph["image"]}` not found in assets/images/.")
        end
      end
    end

    # --- navigation (top menu) ----------------------------------------------
    # navigation.yml drives the header menu. A wrong url here would silently ship
    # a broken nav link, so check the shape: every item needs a name and a url;
    # an internal url must start with "/", an external one must be a full URL and
    # carry `external: true`; children (dropdown) follow the same internal rule.
    def validate_navigation(list)
      return if list.nil?
      unless list.is_a?(Array)
        err("navigation.yml: expected a list of menu items.")
        return
      end
      list.each_with_index do |item, i|
        at = blank?(item["name"]) ? "navigation.yml entry #{i + 1}" : "navigation.yml \"#{item["name"]}\""
        err("#{at}: missing required field `name`.") if blank?(item["name"])
        url = item["url"]
        if blank?(url)
          err("#{at}: missing required field `url`.")
        elsif item["external"]
          err("#{at}: external `url` should be a full URL (http...), got: #{url}") unless url.to_s.start_with?("http")
        elsif !url.to_s.start_with?("/")
          err("#{at}: internal `url: #{url}` should start with \"/\" (e.g. /news/), or set `external: true` for an outside link.")
        end
        (item["children"] || []).each_with_index do |c, j|
          cat = "#{at} child #{j + 1}"
          err("#{cat}: missing required field `name`.") if blank?(c["name"])
          if blank?(c["url"])
            err("#{cat}: missing required field `url`.")
          elsif !c["url"].to_s.start_with?("/")
            err("#{cat}: `url: #{c["url"]}` should start with \"/\".")
          end
        end
      end
    end

    # --- PI record (pi.yml is one record, not a list) -----------------------
    def validate_pi(pi)
      return if pi.nil?
      unless pi.is_a?(Hash)
        err("pi.yml: expected a single PI record (key: value lines).")
        return
      end
      %w[name title].each do |f|
        err("pi.yml: missing required field `#{f}`.") if blank?(pi[f])
      end
      if !blank?(pi["photo"]) && !image_exists?(File.join("people", pi["photo"]))
        err("pi.yml: `photo: #{pi["photo"]}` not found in assets/images/people/.")
      end
      err("pi.yml: `email` looks invalid (no '@'): #{pi["email"]}") if !blank?(pi["email"]) && !pi["email"].to_s.include?("@")
      %w[scholar orcid github].each do |f|
        err("pi.yml: `#{f}` should be a full URL (http...), got: #{pi[f]}") if !blank?(pi[f]) && !pi[f].to_s.start_with?("http")
      end
    end

    # --- home (hero + contact block) ----------------------------------------
    def validate_home(home)
      return if home.nil? || !home.is_a?(Hash)
      contact = home["contact"]
      if contact.is_a?(Hash) && !blank?(contact["email"]) && !contact["email"].to_s.include?("@")
        err("home.yml: `contact.email` looks invalid (no '@'): #{contact["email"]}")
      end
    end

    # --- positions (Positions page copy; a record with an intro + sections list) --
    # positions.html iterates `paragraphs` and `projects` as lists, and Liquid
    # iterates ZERO times over a scalar -- so a `paragraphs:` written as one value,
    # or a mis-nested `projects:`, would silently drop that text / those cards with
    # a green build. Validate the shape so that mistake fails loudly instead.
    def validate_positions(pos)
      return if pos.nil?
      unless pos.is_a?(Hash)
        err("positions.yml: expected a single record (key: value lines).")
        return
      end
      if !blank?(pos["guide_url"]) && !pos["guide_url"].to_s.start_with?("http")
        err("positions.yml: `guide_url` should be a full URL (http...), got: #{pos["guide_url"]}")
      end
      secs = pos["sections"]
      return if secs.nil?
      unless secs.is_a?(Array)
        err("positions.yml: `sections` must be a list (each role starts with `-`).")
        return
      end
      secs.each_with_index do |s, i|
        at = blank?(s["title"]) ? "positions.yml section #{i + 1}" : "positions.yml \"#{s["title"]}\""
        err("#{at}: missing required field `title`.") if blank?(s["title"])
        paras = s["paragraphs"]
        if paras.nil?
          err("#{at}: missing required field `paragraphs`.")
        elsif !paras.is_a?(Array)
          err("#{at}: `paragraphs` must be a list (each paragraph is a `-` item), not a single value.")
        end
        projs = s["projects"]
        next if projs.nil?
        unless projs.is_a?(Array)
          err("#{at}: `projects` must be a list (each card is a `-` item).")
          next
        end
        projs.each_with_index do |pr, j|
          pat = "#{at} project #{j + 1}"
          %w[title body].each { |f| err("#{pat}: missing required field `#{f}`.") if blank?(pr[f]) }
        end
      end
    end

    # --- journal logos ------------------------------------------------------
    # Each journal_logos.yml value must point at a real file in
    # assets/images/journals/, otherwise the publication detail page ships a
    # broken logo image. (A journal with no mapping at all is allowed and warned
    # about in validate_publications; this checks the mapping target exists.)
    def validate_journal_logos(logos)
      return if logos.nil? || !logos.is_a?(Hash)
      logos.each do |journal, file|
        next if blank?(file)
        unless File.file?(File.join(@src, "assets", "images", "journals", file.to_s))
          err("journal_logos.yml: logo file \"#{file}\" for \"#{journal}\" not found in assets/images/journals/.")
        end
      end
    end
  end
end
