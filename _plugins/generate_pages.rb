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
          site.pages << DataPage.new(site, spec[:dir], raw.to_s, spec[:layout], spec[:field], value)
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
  end

  # A standalone /<dir>/<slug>/index.html rendered with the given layout. The
  # body is empty; the layout pulls the entry's fields from _data by id/slug.
  class DataPage < Jekyll::Page
    def initialize(site, dir, slug, layout, field, value)
      @site = site
      @base = site.source
      @dir  = File.join(dir, slug)
      @name = "index.html"
      process(@name)
      @data = { "layout" => layout, field => value }
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
      @data = {}
      @content = %(<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">) +
        %(<title>Redirecting&hellip;</title><link rel="canonical" href="#{target}">) +
        %(<meta name="robots" content="noindex">) +
        %(<meta http-equiv="refresh" content="0; url=#{target}"></head>) +
        %(<body>Redirecting to <a href="#{target}">#{target}</a>&hellip;</body></html>)
    end
  end
end
