# Generate every data-driven page from the _data/*.yml files, so adding a
# person or a paper is a SINGLE edit to one YAML file -- no hand-written stub.
#
#   publications.yml  ->  /publications/<id>/   (layout: publication)
#   people.yml        ->  /people/<slug>/       (layout: person)
#
# People have ONE canonical URL (/people/<slug>/) regardless of whether they are
# a current member or an alumnus -- their `status` field only decides which grid
# (Members or Alumni) lists them. For backward compatibility the old per-status
# addresses /members/<slug>/ and /alumni/<slug>/ are emitted as redirects to the
# canonical page, so existing links keep working even after a status change.
#
# Runs under `bundle exec jekyll build` (custom plugins enabled in CI, D2/D21).
module SAIL
  class DataPageGenerator < Jekyll::Generator
    safe true
    priority :normal

    SPECS = [
      { data: "publications", dir: "publications", layout: "publication", key: "id",   field: "pid"  },
      { data: "people",       dir: "people",       layout: "person",      key: "slug", field: "slug" },
    ].freeze

    def generate(site)
      @site = site
      SPECS.each do |spec|
        list = site.data[spec[:data]]
        next unless list.is_a?(Array)
        list.each do |entry|
          raw = entry[spec[:key]]
          next if raw.nil? || raw.to_s.strip.empty?
          value = spec[:field] == "pid" ? raw.to_i : raw.to_s
          meta = seo_meta(spec[:data], entry)
          site.pages << DataPage.new(site, spec[:dir], raw.to_s, spec[:layout], spec[:field], value, meta)
        end
      end

      people = site.data["people"]
      if people.is_a?(Array)
        people.each do |person|
          slug = person["slug"].to_s
          next if slug.strip.empty?
          target = "#{site.baseurl}/people/#{slug}/"
          %w[members alumni].each { |old| site.pages << RedirectPage.new(site, old, slug, target) }
        end
      end

      pi_page_meta(site)
    end

    private

    # A meta description is kept within 160 characters: Bing's site scan reports a longer
    # one, and Google cuts the snippet near that length anyway.
    DESC_MAX = 160

    # pi.html is hand-written, but its <title> and meta description are set here from
    # _data/pi.yml, so they follow the PI's own entry (a new title or department reaches
    # search results too) instead of a copy in front matter that would go stale. The
    # title is the PI's name with the Korean name, as on every generated person page. A
    # `title` or `description` written in pi.html's front matter is kept (it wins over
    # the built one).
    def pi_page_meta(site)
      pi = site.data["pi"]
      page = site.pages.find { |p| p.url == "/pi/" }
      name = pi.is_a?(Hash) ? pi["name"].to_s.strip : ""
      if page.nil? || name.empty?
        Jekyll.logger.warn "Pages:", "/pi/ title and description not set from _data/pi.yml " \
                                     "(#{page ? "pi.yml has no name" : "no page at /pi/"})."
        return
      end
      nk  = pi["name_ko"].to_s.strip
      who = nk.empty? ? name : "#{name} (#{nk})"
      # With the Korean at hand, the description starts with it ("국민대학교 화학부 정준영 교수."),
      # for Naver and Korean searches (D58), and the English then fits 160 characters.
      ko = [site.config["university_ko"], pi["department_ko"], nk].map { |v| v.to_s.strip }
      desc = if ko.none?(&:empty?)
               "#{ko.join(" ")} 교수. #{name}, #{pi["title"]}, #{pi["department"]}, " \
               "#{pi["institution"]}, leads the #{site.config["title"]} (#{site.config["short_name"]})."
             else
               "#{who}, #{pi["title"]}, #{pi["department"]}, #{pi["institution"]}. Principal " \
               "Investigator of the #{site.config["title"]} (#{site.config["short_name"]})."
             end
      page.data["title"] ||= who
      page.data["description"] ||= clip(desc, DESC_MAX)
      # Link previews show the PI's portrait, as every person page shows its own. An
      # `image` in pi.html's front matter wins; the site-wide default (og-image.png)
      # comes from _config.yml defaults, which are not keys of page.data.
      photo = pi["photo"].to_s.strip
      page.data["image"] = "/assets/images/people/#{photo}" unless photo.empty? || page.data.key?("image")
    end

    # Per-page SEO <title> + meta description for a generated page. Without this,
    # every generated paper/person page inherits the generic site title and
    # description -- bad for search engines and AI answer engines. jekyll-seo-tag
    # reads page.title / page.description from here.
    def seo_meta(kind, entry)
      case kind
      when "publications"
        # The title adds the venue and year, "(Nature, 2025)", so a search that names the
        # journal finds the paper, and a result or link preview says where it appeared.
        # Only for a paper with a public version (a DOI or a preprint), the rule
        # citation-meta.html and structured-data.html use: "Submitted" is not a venue.
        # The page's own heading stays the paper's title.
        title = plain(entry["title"])
        public_version = !entry["doi"].to_s.strip.empty? || !entry["preprint_url"].to_s.strip.empty?
        venue = entry["journal"].to_s.strip
        venue = "" if venue == "Submitted" # a status (46 has a preprint while under review)
        year  = entry["year"].to_s.strip
        title += " (#{venue}, #{year})" if public_version && !venue.empty? && !year.empty?
        desc = plain(entry["abstract"]).strip
        # Without an abstract: the citation as the page shows it, its status included
        # ("Chem. Eng. J., accepted (2026)" for 47, which has no volume yet).
        status = entry["vol"].to_s.strip.empty? ? entry["ref"].to_s.strip : ""
        cited = [entry["journal"].to_s.strip, status].reject(&:empty?).join(", ")
        desc = "#{cited} (#{entry["year"]}). #{strip_markers(entry["authors"])}" if desc.empty?
        meta = { "title" => title, "description" => clip(desc, DESC_MAX) }
        # Per-paper OG/Twitter image = its graphical abstract, so link previews and
        # AI/social cards show the figure instead of the generic site banner: the larger
        # copy <base>-full.jpg where there is one (40 papers; the thumbnails are 360px
        # wide, under the 600px a large preview needs), as the page shows it. Papers
        # with no image (e.g. the preprint id 43) fall back to the site default.
        img = entry["image"].to_s.strip
        unless img.empty?
          full = "#{File.basename(img, File.extname(img))}-full.jpg"
          img = full if File.exist?(File.join(@site.source, "assets", "images", "pubs", full))
          meta["image"] = "/assets/images/pubs/#{img}"
        end
        meta
      when "people"
        # The title carries the Korean name too, "Jihwan Kim (김지환)", as the page's
        # heading does, so a search in Korean finds the page by its title.
        nk   = entry["name_ko"].to_s.strip
        who  = nk.empty? ? entry["name"].to_s : "#{entry["name"]} (#{nk})"
        dept = entry["department"].to_s.strip
        # A person's own `description:` (the short bio shown on their page) beats
        # the formulaic line; both are clipped to a search-snippet length. The line
        # says "former" for an alumnus, as the page and the structured data do.
        desc = entry["description"].to_s.strip
        if desc.empty?
          at_lab = "#{"former " if entry["status"].to_s.strip == "alumni"}#{entry["role"]} at the Spectroscopy and AI Lab (SAIL)"
          desc = dept.empty? ?
            "#{who}, #{at_lab}, Department of Chemistry, Kookmin University." :
            "#{who}, #{dept}, Kookmin University; #{at_lab}."
        end
        meta = { "title" => who, "description" => clip(desc, DESC_MAX) }
        # Per-person OG/Twitter image = their portrait (same fallback rule as papers).
        photo = entry["photo"].to_s.strip
        meta["image"] = "/assets/images/people/#{photo}" unless photo.empty?
        meta
      else
        {}
      end
    end

    def strip_markers(str)
      str.to_s.gsub(/[*†‡]/, "").gsub(/\s+/, " ").strip
    end

    # A title or abstract as plain text: the <sub> and <sup> of a formula ("CO<sub>2</sub>")
    # are for the page; the tab title, the description and link previews get "CO2".
    def plain(str)
      str.to_s.gsub(/<[^>]*>/, "")
    end

    # At most n characters with the "…", cut at a word and without a dangling comma.
    def clip(str, n)
      s = str.to_s.gsub(/\s+/, " ").strip
      return s if s.length <= n
      head = s[0, n - 1].rpartition(" ").first.sub(/[\s,;:]+\z/, "")
      (head.empty? ? s[0, n - 1] : head) + "…"
    end
  end

  # A standalone /<dir>/<slug>/index.html rendered with the given layout. The
  # body is empty; the layout pulls the entry's fields from _data by id/slug.
  class DataPage < Jekyll::Page
    def initialize(site, dir, slug, layout, field, value, extra = {})
      @site = site
      @base = site.source
      @dir  = File.join(dir, slug)
      @name = "index.html"
      process(@name)
      @data = { "layout" => layout, field => value }.merge(extra)
    end
  end

  # A static /<dir>/<slug>/ page that immediately redirects to `target`.
  class RedirectPage < Jekyll::Page
    def initialize(site, dir, slug, target)
      @site = site
      @base = site.source
      @dir  = File.join(dir, slug)
      @name = "index.html"
      process(@name)
      @data = { "sitemap" => false }
      # The canonical is absolute, like every other page's (seo-tag writes site url + path).
      canonical = site.config["url"].to_s.chomp("/") + target
      @content = %(<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">) +
        %(<title>Redirecting&hellip;</title><link rel="canonical" href="#{canonical}">) +
        %(<meta name="robots" content="noindex">) +
        %(<meta http-equiv="refresh" content="0; url=#{target}"></head>) +
        %(<body>Redirecting to <a href="#{target}">#{target}</a>&hellip;</body></html>)
    end
  end
end
