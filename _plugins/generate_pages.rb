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
    end

    private

    # Per-page SEO <title> + meta description for a generated page. Without this,
    # every generated paper/person page inherits the generic site title and
    # description (52 identical titles) -- bad for search engines and AI answer
    # engines. jekyll-seo-tag reads page.title / page.description from here.
    def seo_meta(kind, entry)
      case kind
      when "publications"
        desc = entry["abstract"].to_s.strip
        desc = "#{entry["journal"]} (#{entry["year"]}). #{strip_markers(entry["authors"])}" if desc.empty?
        { "title" => entry["title"].to_s, "description" => clip(desc, 200) }
      when "people"
        nk   = entry["name_ko"].to_s.strip
        who  = nk.empty? ? entry["name"].to_s : "#{entry["name"]} (#{nk})"
        dept = entry["department"].to_s.strip
        desc = dept.empty? ?
          "#{who}, #{entry["role"]} at the Spectroscopy and AI Lab (SAIL), Department of Chemistry, Kookmin University." :
          "#{who}, #{entry["role"]} in the #{dept}, Kookmin University, and a member of the Spectroscopy and AI Lab (SAIL)."
        { "title" => entry["name"].to_s, "description" => desc }
      else
        {}
      end
    end

    def strip_markers(str)
      str.to_s.gsub(/[*†‡]/, "").gsub(/\s+/, " ").strip
    end

    def clip(str, n)
      s = str.to_s.gsub(/\s+/, " ").strip
      return s if s.length <= n
      head = s[0, n].rpartition(" ").first
      (head.empty? ? s[0, n] : head) + "…"
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
      @content = %(<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">) +
        %(<title>Redirecting&hellip;</title><link rel="canonical" href="#{target}">) +
        %(<meta name="robots" content="noindex">) +
        %(<meta http-equiv="refresh" content="0; url=#{target}"></head>) +
        %(<body>Redirecting to <a href="#{target}">#{target}</a>&hellip;</body></html>)
    end
  end
end
