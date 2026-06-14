# Generate every data-driven page from the _data/*.yml files, so adding a
# member, alumnus, or paper is a SINGLE edit to one YAML file -- no hand-written
# collection stub next to it.
#
# Before this, each member/alumnus/publication detail page needed a tiny stub
# file (`slug:`/`pid:` + permalink) in a Jekyll collection in addition to the
# data entry. The templates already read everything from _data, so the stubs
# were pure routing scaffolding a non-coder could forget. This generator creates
# the same /<dir>/<id>/ pages directly from the data:
#
#   publications.yml  ->  /publications/<id>/   (layout: publication, pid: <id>)
#   members.yml       ->  /members/<slug>/      (layout: member,      slug: <slug>)
#   alumni.yml        ->  /alumni/<slug>/       (layout: alumnus,      slug: <slug>)
#
# The layouts look the entry up in the same _data file by id/slug, so _data
# stays the one source of truth. Entries without an id/slug are skipped (the
# grid still lists them; they just have no personal page) -- the data validator
# (validate_data.rb) flags the mistakes that matter.
#
# Runs under `bundle exec jekyll build` (custom plugins enabled in CI, D2/D21).
module SAIL
  class DataPageGenerator < Jekyll::Generator
    safe true
    priority :normal

    # data file, output dir, layout, lookup key in the data, page field the
    # layout reads (pid is an Integer to match `where: "id"`; slug is a String).
    SPECS = [
      { data: "publications", dir: "publications", layout: "publication", key: "id",   field: "pid"  },
      { data: "members",      dir: "members",      layout: "member",      key: "slug", field: "slug" },
      { data: "alumni",       dir: "alumni",       layout: "alumnus",     key: "slug", field: "slug" },
    ].freeze

    def generate(site)
      SPECS.each do |spec|
        list = site.data[spec["data"] || spec[:data]]
        next unless list.is_a?(Array)
        list.each do |entry|
          raw = entry[spec[:key]]
          next if raw.nil? || raw.to_s.strip.empty?
          value = spec[:field] == "pid" ? raw.to_i : raw.to_s
          site.pages << DataPage.new(site, spec[:dir], raw.to_s, spec[:layout], spec[:field], value)
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
end
