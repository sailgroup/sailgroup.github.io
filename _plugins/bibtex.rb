# Liquid filters: bibtex, bibtex_all
#
# The BibTeX entry of a paper in _data/publications.yml. `p | bibtex` gives one entry (the
# paper page shows it under "BibTeX", _layouts/publication.html); `site.data.publications
# | bibtex_all` gives every paper with a DOI, newest first (/publications.bib). One place
# writes the entries, so the page and the file always agree.
#
#   @article{joung2025electron,
#     author = {Joonyoung F. Joung and Mun Hong Fong and ... and Connor W. Coley},
#     title = {{Electron flow matching for generative reaction mechanism prediction}},
#     journal = {Nature},
#     year = {2025},
#     volume = {645},
#     pages = {115-123},
#     doi = {10.1038/s41586-025-09426-9}
#   }
#
# The fields come from the data as written: authors (the * and dagger marks are notes,
# not part of a name, so they are dropped), title (in double braces, so a style keeps its
# capitals; a formula's <sub> and <sup> become \textsubscript{} and \textsuperscript{}:
# CO\textsubscript{2}), journal, year, vol (volume), issue (number), pages, and the DOI without
# https://doi.org/. A field without a value is left out, and so is a paper without a DOI
# (a submitted one). BibTeX's special characters & % $ # _ { } ~ ^ and the backslash are
# escaped; other Unicode is kept as it is. The DOI is written as it is: biblatex reads it
# verbatim, and DOIs do not use those characters.
#
# The key is the first author's family name, the year and the first word of the title
# (A, An and The skipped), in lower-case ASCII: joung2025electron. If papers would share
# a key, each of them gets a letter, a, b, ... in the order of their ids.
module Jekyll
  module BibtexFilter
    MARKS = /[*†‡]/ # * corresponding author, dagger and double dagger notes
    ELLIPSIS = /\A(\.\.\.|…)\z/
    SCRIPTS = { "sub" => "\\textsubscript", "sup" => "\\textsuperscript" }.freeze
    SPECIAL = {
      "\\" => "\\textbackslash{}", "{" => "\\textbraceleft{}", "}" => "\\textbraceright{}",
      "&" => "\\&", "%" => "\\%", "$" => "\\$", "#" => "\\#", "_" => "\\_",
      "~" => "\\textasciitilde{}", "^" => "\\textasciicircum{}",
    }.freeze

    def bibtex(paper)
      return "" unless paper.is_a?(Hash)
      doi = BibtexFilter.doi(paper)
      return "" if doi.empty?
      site = @context.registers[:site]
      key = BibtexFilter.keys(site.data["publications"])[paper["id"].to_s] || BibtexFilter.base_key(paper)
      fields = [
        ["author", BibtexFilter.authors(paper["authors"])],
        ["title", paper["title"]],
        ["journal", paper["journal"]],
        ["year", paper["year"]],
        ["volume", paper["vol"]],
        ["number", paper["issue"]],
        ["pages", paper["pages"]],
      ]
      lines = fields.map { |name, value| [name, value.to_s.strip] }.reject { |_, value| value.empty? }.map do |name, value|
        name == "title" ? "  title = {{#{BibtexFilter.title(value)}}}" : "  #{name} = {#{BibtexFilter.escape(value)}}"
      end
      lines << "  doi = {#{doi}}"
      "@article{#{key},\n#{lines.join(",\n")}\n}"
    end

    def bibtex_all(papers)
      return "" unless papers.is_a?(Array)
      papers.map { |p| bibtex(p) }.reject(&:empty?).join("\n\n")
    end

    def self.doi(paper)
      paper["doi"].to_s.strip.sub(%r{\Ahttps?://(dx\.)?doi\.org/}i, "")
    end

    # "A, B*, C" -> "A and B and C". A "..." standing for left-out names becomes "others"
    # at the end, BibTeX's word for a list that is not complete.
    def self.authors(str)
      names = str.to_s.gsub(MARKS, "").split(",").map(&:strip).reject(&:empty?)
      cut = names.any? { |n| n.match?(ELLIPSIS) }
      names = names.reject { |n| n.match?(ELLIPSIS) }
      names << "others" if cut
      names.join(" and ")
    end

    def self.escape(str)
      str.gsub(/[\\{}&%$#_~^]/) { |c| SPECIAL[c] }
    end

    # "CsPbBr<sub>3</sub>" -> "CsPbBr\textsubscript{3}"; the text around is escaped as usual,
    # and any other tag is dropped.
    def self.title(str)
      str.split(%r{(<su[bp]>.*?</su[bp]>)}).map do |part|
        m = part.match(%r{\A<(su[bp])>(.*?)</su[bp]>\z})
        m ? "#{SCRIPTS[m[1]]}{#{escape(m[2])}}" : escape(part.gsub(/<[^>]*>/, ""))
      end.join
    end

    def self.ascii(str)
      str.to_s.unicode_normalize(:nfkd).gsub(/[^\x00-\x7F]/, "")
    end

    def self.base_key(paper)
      first = paper["authors"].to_s.gsub(MARKS, "").split(",").first.to_s.strip
      family = ascii(first.split(/\s+/).last).downcase.gsub(/[^a-z0-9]/, "")
      words = ascii(paper["title"].to_s.gsub(/<[^>]*>/, "")).split(/[^A-Za-z0-9]+/).select { |w| w.match?(/[A-Za-z]/) }
      word = words.find { |w| !%w[a an the].include?(w.downcase) }.to_s.downcase
      "#{family.empty? ? "paper" : family}#{paper["year"]}#{word}"
    end

    # id -> key for every paper with a DOI; papers sharing a base key get a, b, ... by id.
    def self.keys(papers)
      return {} unless papers.is_a?(Array)
      with_doi = papers.select { |p| p.is_a?(Hash) && !doi(p).empty? }.sort_by { |p| p["id"].to_i }
      out = {}
      with_doi.group_by { |p| base_key(p) }.each do |base, group|
        group.each_with_index do |p, i|
          out[p["id"].to_s] = group.size > 1 ? "#{base}#{("a".ord + i).chr}" : base
        end
      end
      out
    end
  end
end

Liquid::Template.register_filter(Jekyll::BibtexFilter)
