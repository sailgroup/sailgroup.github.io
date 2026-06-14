# Liquid filter: sort_member_pubs
#
# Orders the merged publication list shown on a person's page
# (_includes/member-pubs.html). Two requirements:
#   1. newest year first;
#   2. for the SAME year, the lab Publications papers sit above the person's own
#      external papers.
#
# member-pubs.html builds the list lab-papers-first, so a paper's original index
# already encodes its source (every lab paper has a lower index than every own
# paper). Sorting by [-year, original_index] therefore yields year-descending
# with lab-before-own on a tie -- and, because the index is unique, the order is
# fully deterministic (Liquid's built-in `sort` is unstable, which is why the
# previous `sort: "year" | reverse` could reshuffle same-year papers).
module Jekyll
  module PubSortFilter
    def sort_member_pubs(input)
      arr = input.is_a?(Array) ? input : (input.respond_to?(:to_a) ? input.to_a : nil)
      return input if arr.nil?
      arr.each_with_index.sort_by do |item, idx|
        year = item.is_a?(Hash) ? (item["year"] || item[:year]) : nil
        [-(year.to_i), idx]
      end.map { |item, _idx| item }
    end
  end
end

Liquid::Template.register_filter(Jekyll::PubSortFilter)
