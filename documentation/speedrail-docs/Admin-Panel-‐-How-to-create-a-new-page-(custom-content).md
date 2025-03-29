### Introduction

by default, active admin panels are linked to tables, aka "resources" depending who you ask. if you want to create an arbitrary page of content, such as the included Dashboard view, run `rails g active_admin:page PageName` from your CLI.

here i've created a page called Example, which generates a single file (`app/admin/example.rb`) and has an empty view.

![active-admin-example-page-backend](https://github.com/ryanckulp/speedrail-docs/assets/3083888/c611c97b-4102-44ce-96b1-4c7f08c788f4)

the page itself is linked from the admin panel navigation, at the very bottom of the list of links.

![active-admin-example-page-frontend](https://github.com/ryanckulp/speedrail-docs/assets/3083888/59a5527e-2da7-44b8-ad7e-d0cefa5cacf8)

### DSL for custom content

to populate a custom page with content, we have to leverage Rails style content tags. so instead of something like:

```html
<div class="mb-2">
  <h2 class="text-lg">User Count: <%= User.count %></h2>
</div>
```

we need to build this in Ruby:

```rb
content do
  div class: 'mb-2' do
    h2 'User Count:', class: 'text-lg' do
      span User.count
    end
  end
end
```

a few pointers to make this new syntax less painful:

* first build your markup in regular HTML / ERB; render it on your home page or a dummy view to confirm the look and feel
* copy/paste your HTML into a new tab of your text editor and go line by line, replacing all `<html tag>...</html tag>` instances with `html_tag do ... end`. we're simply writing Ruby blocks instead of using open/closing HTML tags.
* drop all `<%= ... %>` ERB tags. since we're writing this directly into an `.rb` file, we don't have to interpolate Ruby into HTML.
* avoid using `p` for the `<p>` paragraph tab, because Ruby also has `p` as a `puts` or `inspect` reserved keyword. instead use `span`
* the general format for this style of HTML markup is: `tag_name "content here", class: "css classes", id: "id if necessary" do... end`