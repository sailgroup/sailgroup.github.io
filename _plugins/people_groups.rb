# Liquid filter: in_group
#
# The people of one group of _data/people_groups.yml, the rows of the Alumni page:
#
#   {% assign alumni = site.data.people | where: "status", "alumni" %}
#   {% assign rows = alumni | in_group: "undergrad" %}
#
# A person's group is their `group:` in people.yml, or else the first group with a `match`
# word that starts a word of their `role`, capitals aside: "Postdoc" fits "Postdoctoral
# Researcher" and "Ph.D." fits "M.S./Ph.D.", but "UROP" does not fit inside "European".
# The people keep their order in people.yml. validate_data.rb uses the same rule
# (SAIL::PeopleGroups.key), so an alumnus who fits no group stops the build instead of
# going missing from the page.
module SAIL
  module PeopleGroups
    def self.key(person, groups)
      return nil unless person.is_a?(Hash)
      own = person["group"].to_s.strip
      return own unless own.empty?
      role = person["role"].to_s
      hit = Array(groups).find do |g|
        g.is_a?(Hash) && Array(g["match"]).any? { |w| fits?(role, w) }
      end
      hit && hit["key"].to_s
    end

    def self.fits?(role, word)
      w = word.to_s.strip
      !w.empty? && role.match?(/(?<![[:alnum:]])#{Regexp.escape(w)}/i)
    end
  end

  module PeopleGroupFilter
    def in_group(people, key)
      groups = @context.registers[:site].data["people_groups"]
      Array(people).select { |p| PeopleGroups.key(p, groups) == key.to_s }
    end
  end
end

Liquid::Template.register_filter(SAIL::PeopleGroupFilter)
