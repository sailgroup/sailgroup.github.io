# Auto-create a detail page for every publication in _data/publications.yml.
#
# Why: the publications list and each member page are already driven entirely by
# _data/publications.yml. Detail pages, however, used to need a hand-written stub
# in _publications/<id>.md. This generator removes that second step: add a paper
# to publications.yml and its /publications/<id>/ page appears automatically.
#
# It is additive and safe. If a stub already exists in the _publications
# collection for an id, that stub wins and we skip it, so the 41 existing pages
# are untouched. Only ids without a stub get a generated page.
#
# This runs because the site is built with `bundle exec jekyll build` in GitHub
# Actions (custom plugins are enabled), not the restricted github-pages gem.
module SAIL
  class PublicationPageGenerator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      pubs = site.data["publications"]
      return unless pubs.is_a?(Array)

      collection = site.collections["publications"]
      stubbed = collection ? collection.docs.map { |d| d.data["pid"].to_s } : []

      pubs.each do |pub|
        id = pub["id"].to_s
        next if id.empty?
        next if stubbed.include?(id)
        site.pages << PublicationPage.new(site, id)
      end
    end
  end

  # A standalone /publications/<id>/index.html that renders with the existing
  # `publication` layout. The layout looks the paper up by page.pid, so the page
  # body stays empty (the same as the old stub files).
  class PublicationPage < Jekyll::Page
    def initialize(site, id)
      @site = site
      @base = site.source
      @dir  = File.join("publications", id)
      @name = "index.html"
      process(@name)
      @data = { "layout" => "publication", "pid" => id.to_i }
    end
  end
end
