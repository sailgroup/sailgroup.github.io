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
    # A paper's link fields (the DOI, preprint, code and dataset icons).
    LINK_FIELDS = %w[doi preprint_url code dataset].freeze

    def generate(site)
      @site   = site
      @src    = site.source
      @errors = []
      @warns  = []

      validate_people_groups(site.data["people_groups"])
      validate_people(site.data["people"], "people.yml", "person")
      validate_themes(site.data["themes"])
      validate_publications(site.data["publications"])
      check_duplicate_pub_fields
      validate_news(site.data["news"])
      validate_covers(site.data["covers"], site.data["publications"])
      validate_research(site.data["research"])
      validate_photos(site.data["photos"])
      validate_navigation(site.data["navigation"])
      validate_pi(site.data["pi"])
      validate_home(site.data["home"])
      validate_positions(site.data["positions"])
      validate_positions(site.data["positions_en"], "positions_en.yml")
      compare_positions(site)
      validate_translations(site)
      check_overview_quote(site)
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
      # On GitHub Actions each problem also becomes an annotation, so the failed run's page
      # shows it; otherwise that page says only "exit code 1" and the list sits in the log.
      if ENV["GITHUB_ACTIONS"] == "true"
        @errors.each { |e| $stdout.puts "::error title=Data check::#{e.gsub("%", "%25").gsub("\r", "%0D").gsub("\n", "%0A")}" }
        $stdout.flush
      end
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
      groups = @site.data["people_groups"]
      group_keys = Array(groups).select { |g| g.is_a?(Hash) }.map { |g| g["key"].to_s }
      list.each_with_index do |p, i|
        at = "#{file} entry #{i + 1}"
        name = p["name"]
        at = "#{file} \"#{name}\"" unless blank?(name)
        err("#{at}: missing required field `name`.") if blank?(name)
        err("#{at}: missing required field `role`.") if blank?(p["role"])
        unless %w[current alumni].include?(p["status"])
          err("#{at}: `status` must be `current` or `alumni` (got #{p["status"].inspect}).")
        end
        # The Alumni page's rows (people_groups.yml): a `group:` names one of them, and an
        # alumnus falls in one, by `group:` or by a word of the role (people_groups.rb).
        if !blank?(p["group"]) && !group_keys.include?(p["group"].to_s.strip)
          err("#{at}: `group: #{p["group"]}` is not one of #{group_keys.join(", ")} (people_groups.yml).")
        elsif p["status"] == "alumni" && !blank?(p["role"]) && SAIL::PeopleGroups.key(p, groups).nil?
          err("#{at}: the Alumni page cannot tell this person's group from the role \"#{p["role"]}\". Add a line `group: ...` with one of #{group_keys.join(", ")}, or a group for this role to people_groups.yml.")
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

    # --- people groups (the Alumni page's rows) -----------------------------
    def validate_people_groups(list)
      return if list.nil?
      unless list.is_a?(Array)
        err("people_groups.yml: expected a list of groups.")
        return
      end
      seen = {}
      list.each_with_index do |g, i|
        unless g.is_a?(Hash)
          err("people_groups.yml entry #{i + 1}: expected `key`, `name` and `match`.")
          next
        end
        at = blank?(g["key"]) ? "people_groups.yml entry #{i + 1}" : "people_groups.yml \"#{g["key"]}\""
        err("#{at}: missing required field `key`.") if blank?(g["key"])
        err("#{at}: missing required field `name` (the row's heading).") if blank?(g["name"])
        err("#{at}: `key: #{g["key"]}` must be lowercase letters/numbers/hyphens.") if !blank?(g["key"]) && !(g["key"].to_s =~ SLUG_RE)
        err("#{at}: `match` must be a list of words, e.g. [Postdoc].") if !g["match"].nil? && !g["match"].is_a?(Array)
        next if blank?(g["key"])
        err("#{at}: the key is used twice.") if seen[g["key"]]
        seen[g["key"]] = true
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
        check_markup(pub["title"], pat, "title")
        if !blank?(pub["year"]) && !pub["year"].is_a?(Integer)
          err("#{pat}: `year` must be a plain number with no quotes (year: 2023), got #{pub["year"].inspect}.")
        end
        LINK_FIELDS.each do |f|
          err("#{pat}: `#{f}` should be a full URL (http...), got: #{pub[f]}") if !blank?(pub[f]) && !pub[f].to_s.start_with?("http")
          err("#{pat}: `#{f}: #{pub[f]}` still has the example's \"...\"; put the real address, or leave it empty (\"\").") if !blank?(pub[f]) && pub[f].to_s.include?("...")
        end
        if !blank?(pub["image"]) && !image_exists?(File.join("pubs", pub["image"]))
          err("#{pat}: `image: #{pub["image"]}` not found in assets/images/pubs/.")
        end
      end
    end

    # The only markup a title, an abstract or a news line may carry: <sub> and <sup>, for a
    # formula (CO<sub>2</sub>, Mg<sup>2+</sup>; D60), each one closed and none inside another,
    # without attributes. Another tag would show as code or change the page, and a <sub> left
    # open would set the rest of the page small.
    def check_markup(text, at, field)
      return if blank?(text)
      tags = text.to_s.scan(%r{</?[A-Za-z][^>]*>})
      bad = tags.reject { |t| t.match?(%r{\A</?su[bp]>\z}) }
      unless bad.empty?
        err("#{at}: `#{field}` may use only <sub> and <sup>, for a formula such as CO<sub>2</sub>; found #{bad.uniq.join(" ")}.")
        return
      end
      open = nil
      tags.each do |t|
        name = t.delete("</>")
        if t.start_with?("</")
          return err("#{at}: `#{field}` has #{t} with no <#{name}> before it.") unless open == name
          open = nil
        else
          return err("#{at}: `#{field}` opens #{t} inside <#{open}>; close <#{open}> first.") if open
          open = name
        end
      end
      err("#{at}: `#{field}` opens <#{open}> and does not close it; add </#{open}>.") if open
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
        %w[title abstract abstract_ko].each { |f| check_markup(p[f], at, f) }
        # year must be a plain number; a quoted "2026" mixes types with the other
        # (integer) years and breaks the year grouping/sort on the list page.
        if !blank?(p["year"]) && !p["year"].is_a?(Integer)
          err("#{at}: `year` must be a plain number with no quotes (year: 2026), got #{p["year"].inspect}.")
        end
        if !blank?(p["image"]) && !image_exists?(File.join("pubs", p["image"]))
          err("#{at}: `image: #{p["image"]}` not found in assets/images/pubs/.")
        end
        LINK_FIELDS.each do |f|
          v = p[f]
          err("#{at}: `#{f}` should be a full URL (http...), got: #{v}") if !blank?(v) && !v.to_s.start_with?("http")
          err("#{at}: `#{f}: #{v}` still has the example's \"...\"; put the real address, or leave it empty (\"\").") if !blank?(v) && v.to_s.include?("...")
        end
        # A link line indented like the abstract's text (four spaces) is read as part of the
        # abstract: it shows as text on the paper page and its icon never appears.
        %w[abstract abstract_ko].each do |f|
          m = p[f].to_s.match(/\b(#{LINK_FIELDS.join("|")}):\s*"https?:\/\/[^"\s]*"?/)
          err("#{at}: the #{f} contains `#{m[0]}`, so that line was read as part of the #{f}. Start it with two spaces, the same as `#{f}:`, not four.") if m
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

    # YAML keeps the last of two same-named fields in one entry without a word, so a
    # `code:` or `dataset:` line added while the paper's empty slot is still there can
    # silently lose. The parsed data cannot show that, so read the file's text.
    def check_duplicate_pub_fields
      path = File.join(@src, @site.config["data_dir"] || "_data", "publications.yml")
      return unless File.file?(path)
      label = nil
      seen = {}
      File.foreach(path).with_index(1) do |line, n|
        if (m = line.match(/\A- ([A-Za-z_]+):(.*)/))
          label = m[1] == "id" ? "id #{m[2].strip}" : "the entry on line #{n}"
          seen = { m[1] => n }
        elsif label && (m = line.match(/\A  ([A-Za-z_]+):(.*)/))
          key = m[1]
          label = "id #{m[2].strip}" if key == "id"
          if seen[key]
            err("publications.yml #{label}: `#{key}` is written twice (lines #{seen[key]} and #{n}), and only the last one counts. Keep one `#{key}:` line.")
          else
            seen[key] = n
          end
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
        %w[title body].each { |f| check_markup(n[f], at, f) }
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
        # `links`: more links on the item's line (D60), each a `text` and a `url` held to the
        # same rule as `link`.
        more = n["links"]
        if !more.nil? && !more.is_a?(Array)
          err("#{at}: `links` must be a list, each entry a `- text: ...` line with a `url: ...` line under it.")
        elsif more
          more.each_with_index do |l, j|
            lat = "#{at} links entry #{j + 1}"
            unless l.is_a?(Hash)
              err("#{lat}: expected `text` and `url`.")
              next
            end
            err("#{lat}: missing `text` (the words of the link).") if blank?(l["text"])
            u = l["url"].to_s
            if blank?(l["url"])
              err("#{lat}: missing `url`.")
            elsif !u.start_with?("/") && !u.start_with?("http")
              err("#{lat}: `url: #{u}` must be an internal path (starts with \"/\") or a full URL (http...).")
            end
          end
        end
        if !blank?(n["links_label"]) && (!more.is_a?(Array) || more.empty?)
          err("#{at}: `links_label` is set but there are no `links` for it to label.")
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
    # The Korean page (/research/ko/, D65) shows the Korean fields; where one is missing it
    # shows the English, so the build goes on and the log says where.
    def validate_research(data)
      return if data.nil?
      ko_lag = "the Korean page (/research/ko/) shows the English there"
      ov = data["overview"]
      warn("research.yml: missing `overview.ko`; #{ko_lag}.") unless ov.is_a?(Hash) && !blank?(ov["ko"])
      areas = data["areas"]
      return unless areas.is_a?(Array)
      areas.each_with_index do |a, i|
        at = "research.yml area #{i + 1}"
        at = "#{at} (#{a["title"]})" unless blank?(a["title"])
        err("#{at}: missing required field `title`.") if blank?(a["title"])
        err("#{at}: missing required field `body`.") if blank?(a["body"])
        %w[title_ko body_ko].each { |f| warn("#{at}: missing `#{f}`; #{ko_lag}.") if blank?(a[f]) }
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
      # The interview beside the research overview (D60): a YouTube id, the frame's address is
      # built from it; the poster must exist, or the home page shows a broken image.
      iv = home["interview"]
      return if iv.nil?
      unless iv.is_a?(Hash)
        err("home.yml: `interview` must have `youtube`, `title` and `poster` under it.")
        return
      end
      unless iv["youtube"].to_s =~ /\A[A-Za-z0-9_-]{11}\z/
        err("home.yml interview: `youtube` must be the video's 11-character id (in https://youtu.be/Jve6-fJS7Oc it is Jve6-fJS7Oc), got #{iv["youtube"].inspect}.")
      end
      err("home.yml interview: missing `title`.") if blank?(iv["title"])
      if blank?(iv["poster"])
        err("home.yml interview: missing `poster` (a 16:9 image in assets/images/).")
      elsif !image_exists?(iv["poster"])
        err("home.yml interview: `poster: #{iv["poster"]}` not found in assets/images/.")
      end
    end

    # --- positions (Positions page copy; a record with an intro + sections list) --
    # positions.html iterates `paragraphs` and `projects` as lists, and Liquid
    # iterates ZERO times over a scalar -- so a `paragraphs:` written as one value,
    # or a mis-nested `projects:`, would silently drop that text / those cards with
    # a green build. Validate the shape so that mistake fails loudly instead.
    def validate_positions(pos, file = "positions.yml")
      return if pos.nil?
      unless pos.is_a?(Hash)
        err("#{file}: expected a single record (key: value lines).")
        return
      end
      if !blank?(pos["guide_url"]) && !pos["guide_url"].to_s.start_with?("http")
        err("#{file}: `guide_url` should be a full URL (http...), got: #{pos["guide_url"]}")
      end
      secs = pos["sections"]
      return if secs.nil?
      unless secs.is_a?(Array)
        err("#{file}: `sections` must be a list (each role starts with `-`).")
        return
      end
      secs.each_with_index do |s, i|
        at = blank?(s["title"]) ? "#{file} section #{i + 1}" : "#{file} \"#{s["title"]}\""
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

    # The English page (positions_en.yml, D61) translates the Korean one item for item. A
    # difference in the number of roles, paragraphs, cards or guide links, or a sub-heading or
    # a card's `requires` on one side only, means one was changed without the other: the build
    # goes on (the English can follow later), and the log says where they part. A missing file
    # or missing `labels` stops the build, as the page would come out empty or garbled. While
    # the English page is on hold (no positions_en.yml, no /positions/en/), nothing is checked.
    GUIDE_KO = "그룹 가이드" # the Korean page's guide phrase (positions.html)

    def compare_positions(site)
      ko = site.data["positions"]
      en = site.data["positions_en"]
      if site.pages.any? { |pg| pg.url == "/positions/en/" } && !en.is_a?(Hash)
        err("positions_en.yml is missing or is not a record (key: value lines), but positions-en.html builds /positions/en/ from it.")
        return
      end
      return unless en.is_a?(Hash)
      labels = en["labels"]
      unless labels.is_a?(Hash) && %w[guide_phrase guide_button requires].all? { |f| !blank?(labels[f]) }
        err("positions_en.yml: `labels` needs `guide_phrase`, `guide_button` and `requires` (the page's own words).")
        return
      end
      return unless ko.is_a?(Hash)
      lag = "update positions_en.yml to match positions.yml (the English page translates the Korean)"
      text = lambda do |d|
        [d["intro"], *Array(d["sections"]).flat_map { |x| x.is_a?(Hash) ? Array(x["paragraphs"]) : [] }].join("\n")
      end
      a = text.call(ko).scan(GUIDE_KO).size
      b = text.call(en).scan(labels["guide_phrase"].to_s).size
      warn("positions_en.yml links the guide #{b} times (\"#{labels["guide_phrase"]}\"), positions.yml #{a} times (\"#{GUIDE_KO}\"): #{lag}.") if a != b
      ks = Array(ko["sections"])
      es = Array(en["sections"])
      if ks.size != es.size
        warn("positions_en.yml has #{es.size} roles and positions.yml #{ks.size}: #{lag}.")
        return
      end
      ks.zip(es).each_with_index do |(k, e), i|
        next unless k.is_a?(Hash) && e.is_a?(Hash)
        at = "role #{i + 1} (#{k["title"]} / #{e["title"]})"
        %w[paragraphs projects].each do |f|
          n = Array(k[f]).size
          m = Array(e[f]).size
          warn("positions_en.yml #{at}: #{m} #{f}, positions.yml #{n}: #{lag}.") if n != m
        end
        if blank?(k["projects_title"]) != blank?(e["projects_title"])
          warn("positions_en.yml #{at}: `projects_title` on one side only: #{lag}.")
        end
        Array(k["projects"]).zip(Array(e["projects"])).each_with_index do |(kp, ep), j|
          next unless kp.is_a?(Hash) && ep.is_a?(Hash)
          if blank?(kp["requires"]) != blank?(ep["requires"])
            warn("positions_en.yml #{at} card #{j + 1}: `requires` on one side only: #{lag}.")
          end
        end
      end
    end

    # --- translations (pages in more than one language, D61) -------------------
    # head.html writes each group as hreflang links. Search engines drop a group whose pages
    # do not all point at each other, so every version needs a language code, a locale, a
    # name and an address, and the page there must name the group back (and say its language).
    def validate_translations(site)
      groups = site.data["translations"]
      named = site.pages.select { |pg| pg.data["translations"] }
      return if groups.nil? && named.empty?
      unless groups.is_a?(Hash)
        err("translations.yml: expected groups (a name, then its list of versions).")
        return
      end
      groups.each do |key, list|
        unless list.is_a?(Array) && list.size > 1
          err("translations.yml `#{key}`: list at least two versions (each starts with `-`).")
          next
        end
        list.each_with_index do |v, i|
          at = "translations.yml `#{key}` version #{i + 1}"
          unless v.is_a?(Hash)
            err("#{at}: expected `lang`, `locale`, `name` and `url`.")
            next
          end
          err("#{at}: `lang` should be a language code such as ko or en, got #{v["lang"].inspect}.") unless v["lang"].to_s.match?(/\A[a-z]{2,3}(-[A-Za-z0-9]{2,8})*\z/)
          err("#{at}: `locale` should look like ko_KR or en_US, got #{v["locale"].inspect}.") unless v["locale"].to_s.match?(/\A[a-z]{2,3}_[A-Z]{2}\z/)
          err("#{at}: missing `name` (the language's name in that language).") if blank?(v["name"])
          pg = site.pages.find { |x| x.url == v["url"].to_s }
          if pg.nil?
            err("#{at}: no page has the address #{v["url"].inspect}.")
          elsif pg.data["translations"].to_s != key.to_s
            err("#{at}: #{pg.name} (#{v["url"]}) needs `translations: #{key}` in its front matter.")
          elsif (pg.data["lang"] || site.config["lang"]).to_s != v["lang"].to_s
            err("#{at}: #{pg.name} is `lang: #{pg.data["lang"] || site.config["lang"]}`, but the list says #{v["lang"]}.")
          end
        end
      end
      named.each do |pg|
        g = pg.data["translations"].to_s
        list = groups[g]
        if !list.is_a?(Array)
          err("#{pg.name}: `translations: #{g}` names no group in translations.yml.")
        elsif list.none? { |v| v.is_a?(Hash) && v["url"].to_s == pg.url }
          err("#{pg.name}: its group `#{g}` in translations.yml does not list its address #{pg.url}.")
        end
      end
    end

    # The meta descriptions of both homes (/ and /ko/) and of Positions quote the first
    # sentence of the lab's Korean overview (research.yml overview.ko) after its subject,
    # "...은 " (D61; the first sentence only since the overview grew to a paragraph, D65). When the PI rewrites that
    # sentence, the descriptions should follow: the log says which page still has the old.
    # The Korean Research page's and the Korean home's descriptions name the areas by their
    # Korean names (D65, D66).
    def check_overview_quote(site)
      ko = site.data.dig("research", "overview", "ko").to_s.gsub(/\s+/, " ").strip
      rest = ko.split(/[은는] /, 2)[1].to_s.strip
      said = rest[/\A.*?다\./] || rest
      unless said.empty?
        ["/", "/ko/", "/positions/"].each do |u|
          pg = site.pages.find { |x| x.url == u }
          next unless pg
          next if pg.data["description"].to_s.gsub(/\s+/, " ").include?(said)
          warn("#{pg.name}: its description no longer quotes research.yml overview.ko (\"#{said}\"); bring it up to date.")
        end
      end
      areas = site.data.dig("research", "areas")
      return unless areas.is_a?(Array)
      names = areas.map { |a| a["title_ko"].to_s.gsub(/\s+/, " ").strip }.reject(&:empty?)
      ["/research/ko/", "/ko/"].each do |u|
        pg = site.pages.find { |x| x.url == u }
        next unless pg
        desc = pg.data["description"].to_s.gsub(/\s+/, " ")
        gone = names.reject { |t| desc.include?(t) }
        warn("#{pg.name}: its description does not name #{gone.join(", ")} (research.yml title_ko); bring it up to date.") unless gone.empty?
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
