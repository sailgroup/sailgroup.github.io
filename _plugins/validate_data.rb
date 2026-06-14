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

      validate_people(site.data["members"], "members.yml", "member")
      validate_people(site.data["alumni"],  "alumni.yml",  "alumnus")
      validate_publications(site.data["publications"])
      validate_news(site.data["news"])
      validate_covers(site.data["covers"], site.data["publications"])
      validate_research(site.data["research"])
      validate_photos(site.data["photos"])

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

    def blank?(v); v.nil? || (v.respond_to?(:empty?) && v.strip.empty?); end

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

        if !blank?(p["photo"]) && !image_exists?(p["photo"])
          err("#{at}: `photo: #{p["photo"]}` not found in assets/images/.")
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
        err("#{at}: `email` looks invalid (no '@'): #{p["email"]}") if !blank?(p["email"]) && !p["email"].include?("@")
        if !blank?(p["joined"]) && !(p["joined"].to_s =~ DATE_RE)
          err("#{at}: `joined: #{p["joined"]}` must be YYYY-MM-DD.")
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
        elsif !(n["date"].to_s =~ DATE_RE)
          err("#{at}: `date: #{n["date"]}` must be YYYY-MM-DD.")
        end
        cat = n["category"]
        if !blank?(cat) && !NEWS_CATS.include?(cat)
          err("#{at}: `category: #{cat}` is not one of #{NEWS_CATS.join(", ")}.")
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
        pid = c["publication_id"]
        if !pid.nil? && !ids.include?(pid)
          err("#{at}: `publication_id: #{pid}` does not match any paper in publications.yml.")
        end
      end
    end

    # --- research figures ---------------------------------------------------
    def validate_research(data)
      return if data.nil?
      areas = data["areas"]
      return unless areas.is_a?(Array)
      areas.each_with_index do |a, i|
        next if blank?(a["figure"])
        at = "research.yml area #{i + 1} (#{a["title"]})"
        err("#{at}: `figure: #{a["figure"]}` not found in assets/images/.") unless image_exists?(a["figure"])
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
  end
end
