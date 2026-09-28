source "https://rubygems.org"

gem "jekyll", "~> 4.3"

# The exact versions every build uses are recorded in Gemfile.lock (committed), so a
# new gem release cannot change or break a build until the lockfile is updated.
# CI has no way to update it on its own (bundler runs in deployment mode there): after
# changing this file, regenerate Gemfile.lock too (see CONTRIBUTING.md, "Build tools").
group :jekyll_plugins do
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
end

# Ruby 3 no longer ships these in the standard library.
gem "webrick", "~> 1.8"
gem "csv", "~> 3.3"
gem "base64", "~> 0.2"

# CI link/image checker. Bundler-managed (and locked in Gemfile.lock) so a new
# html-proofer release cannot silently change behavior or break the build (it was
# `gem install`ed fresh each run before). Not in :jekyll_plugins, so the site build
# never loads it.
group :test do
  gem "html-proofer", "~> 5.0"
end
