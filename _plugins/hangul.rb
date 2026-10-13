# Liquid filter: korean
#
# True when a text's first letter is Hangul: its main language is Korean, so the page
# marks it lang="ko" (and translate="no", like the site's other Korean text). Digits and
# punctuation before it do not count ("2026.06.24. 지환 ..."), and an English text that
# ends with Korean names stays English ("Predicting the refractive index ... / - 김찬중").
# assets/js/viewer.js applies the same rule to the captions it shows.
#   {%- assign ko = p.title | korean -%}{% if ko %} lang="ko" translate="no"{% endif %}
module Jekyll
  module HangulFilter
    def korean(input)
      first = input.to_s[/\p{L}/]
      !first.nil? && first.match?(/\p{Hangul}/)
    end
  end
end

Liquid::Template.register_filter(Jekyll::HangulFilter)
