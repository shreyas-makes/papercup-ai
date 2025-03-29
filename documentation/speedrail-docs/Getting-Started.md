### Install Speedrail

to keep these docs DRY, please see the [Installation](https://github.com/ryanckulp/speedrail?tab=readme-ov-file#installation) section of the source code's README. 

**important**: invoke the `speedrail/bin/speedrail new_app_name` from outside* the repository, aka the parent directory from which you ran `git clone <url>` or `gh repo clone ryanckulp/speedrail`.

### Beginning development

once your application is running with `bin/dev`, you should be able to visit `localhost:3000` in your browser and register, log in, etc. features like the Blog and admin panel will be hidden, however, because these require special permissions on your User record.

to write blog posts or use the admin panel, open your Rails Console (`rails c`) in a new terminal tab and...

```rb
u = User.last # assumes you created a User - if you did not, visit localhost:3000/signup
u.update(admin: true)
```

refresh your browser and you should see a new navigation item "Admin." if you visit the "Blog" tab you'll also see a "New blog post" button.

in case you're wondering how this `admin: true` flag handles these features...

- inside `ApplicationController` we defined a method `authenticate_admin!` that is used by our admin panel gem, called Active Admin, from its configuration file `active_admin.rb`, setting `config.authentication_method`, to prevent unauthorized Admin Panel access
- inside `BlogPostsController` we again leverage this same `authenticate_admin!` function, passing in an error message visible to end users
- inside `config/routes.rb`, the `/admin` endpoint doesn't exist unless a User is signed in and `admin=true`

you can leverage `authenticate_admin!` as a `before_action` inside any controller you want to ensure that only Admin Users are able to complete that behavior.

### Using the admin panel

as an Admin, visit `/admin` or click the "Admin" navigation link. you'll land on a blank dashboard, which we'll learn how to customize separately in [Admin Panel docs](https://github.com/ryanckulp/speedrail-docs/wiki/Admin-Panel).

on the left side navigation you'll notice a few links, mostly corresponding to table names already inside Speedrail. Users and BlogPosts are good places to start.

when you navigate to an admin panel page, notice that in some cases you can sort and filter, or create and destroy, but in other views you can't. for example, you can create a Script Tag, but you can not create a User or Blog Post. this is all intentional and will be covered separately.

navigating the admin panel should be self-explanatory, but we'll learn how to add custom features in our Admin Panel documentation.

### Deciding which admin panel to use
after months of experimentation with different admin panel gems and in-house solutions, i landed on the most popular one of all, [Active Admin](https://github.com/activeadmin/activeadmin).

![ruby-admin-interface-ranking](https://github.com/ryanckulp/speedrail-docs/assets/3083888/aa0c89a5-2a26-4aa7-acc3-137db1ee9458)

for years i had a love/hate relationship with Active Admin due to its DSL nature. the acryonym **DSL** stands for "Domain Specific Language" and is a common feature in large Ruby gems. essentially you are writing Ruby, but in a weird flavor that doesn't look or feel like Ruby. the goal of DSLs is to decrease the amount of code you need to write to achieve common outcomes, however they require an upfront cost of learning their syntax.

here's an example of how Active Admin builds an admin-only interface (frontend + backend) for the Blog Post table of Speedrail:

```rb
ActiveAdmin.register BlogPost do
  menu priority: 4

  actions :index

  filter :id
  filter :title

  index do
    column :title
    column :slug
    column 'status' do |blog_post|
      blog_post.draft? ? 'Draft' : 'Published'
    end
    column :created_at

    actions
  end
end
```

kind of confusing right? it almost feels like learning a new language. but after wrestling with alternative solutions for years, i can assure you that it's actually pretty brilliant. this will save you a ton of time. because you won't have to write any HTML, CSS, controllers, routes, helpers, or models. just a single Ruby file, such as the one above, produces a full stack CRUD interface. to learn more about how to use Active Admin, see our docs [here](https://github.com/ryanckulp/speedrail-docs/wiki/Admin-Panel).

### Writing blog posts

this should be self-explanatory. as an Admin user, visit Blog > New Blog Post, or `/blog/new`. by default, all fields except the cover image are required. 

in local development, any assets (images, etc) you add to blog posts will be saved to your local machine, inside the hidden `storage` folder. the contents of this folder are hidden via `.gitignore`, so you don't have to worry about committing sample blog post images. this setting is customizable of course, dictated by your `config/environments/development.rb` file -> `config.active_storage.service` parameter. Speedrail sets this to `:local` by default, however you can change this to another service by modifying `config/storage.yml`. (this will be covered more in depth separately.)

when you create a blog post, the `BlogPost` model's `generate_unique_slug` does a tiny bit of magic to ensure you don't have multiple blog posts with the same name, or invalid URLs as blog slugs. check out the `models/blog_post_spec.rb` examples to see how well this manages poorly formatted blog posts. Writing and running tests generally is covered in more depth [here](https://github.com/ryanckulp/speedrail-docs/wiki/Writing-Tests).