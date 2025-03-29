### Introduction

by default, active admin panels are linked to tables, aka "resources" depending who you ask. assuming your database table already exists, run `rails g active_admin:resource TableName` from your CLI.

this will generate a single file inside `app/admin`, with a pluralized version of your table name. so if your model is `widget`, running `rails g active_admin:resource Widget` will generate `app/admin/widgets.rb`.

next, open up this generated file. by default, Active Admin will provide all the RESTful routes and views that you may be used to from running rails generators. for example, if you run `rails g scaffold Widgets`, you will get a controller, views for index/new/show, a widget model, and so on.

the `active_admin:resource` command does the same thing, but all of the generated logic goes into that single file inside `app/admin`. it's really nice once you get used to it!

after creating your table-backed admin panel view, decide what functionality it should have. do you want admins to only be able to view records? update but not create? create but not destroy? there is no best answer, it's up to you and your app's business logic.

### Understanding the Active Admin DSL 

let's take a look at our existing Users panel to understand how we can implement business logic into Active Admin. i'll go line by line to keep the example code short.

**Priority**

```rb
ActiveAdmin.register User do
  menu priority: 3
  # ...
end
```

a panel's `priority` value determines which slot this page will have in the left side navigation. value of `1` means first, and the higher the number, the lower down it will be. if you accidentally give 2 files the same Priority, active admin will decide which is first.

**Permit Params**

```rb
ActiveAdmin.register User do
  # ...
  permit_params :email, :admin, :stripe_customer_id, :stripe_subscription_id
  # ...
end
```

this is just like your regular controllers' `<object>_params` method, which looks like this:

```rb
def blog_post_params
  params.require(:blog_post).permit(:title, :slug, :description, :body)
end
```

following the `permit_params` invocation of your admin panel, simply list the attributes that you want an admin to be able to modify for a given record of that database table.

**Actions**

```rb
ActiveAdmin.register User do
  # ...
  actions :all, except: [:new]
  # ...
end
```

again, just like regular Rails controllers, the keyword `actions` here responds to controller actions like `new`, `update`, `show`, `create`, and `destroy` that are found in every Rails controller.

by default, Active Admin will allow all actions with its shorthand `actions :all` setup. however if you want this database table to only be eligible for viewing, you could use:

```rb
actions :index
```

and if you only wanted records to be viewed or created...

```rb
actions :index, :new, :create
```

note that `:new` is required to render a User creation form*, while `:create` is required to actually handle the POST request to your own admin panel's backend and create the User.

finally, you can also use `except:` syntax (much like Rails controller filters) to specify actions you do not* want available.

```rb
actions :all, except: [:destroy]
```

**Filters**

```rb
ActiveAdmin.register User do
  # ...
  filter :email
  filter :admin
  # ...
end
```

filters are written as `filter :attribute_name`. so if your Users table has an `email` field, you can write `filter :email`. this will populate a form on the right sidebar of your admin panel, making it easy to run basic queries against your database without any custom code.

![active-admin-user-filters](https://github.com/ryanckulp/speedrail-docs/assets/3083888/cbe8dd3b-da18-4f28-964e-9a24950c9e5d)

**Index**

```rb
ActiveAdmin.register User do
  # ...
  index do
    column :email 
    # ...
  end
end
```

the takeaway here isn't to remember "index," but rather that each Action (index, new, show, etc) can be customized. so in this example, `index do... end` is a block where you can customize what the `admin/users/index` view will look like.

specify attribute-based columns with `column :attribute_name`, or write custom columns like this:

```rb
column :full_name do |user|
  "#{user.first_name} #{user.last_name}"
end
```

going a step further, since a function like `full_name` would be useful for your Users table anyway, you could instead define `full_name` inside your User model, then do this instead:

```rb
column 'full_name' do |user|
  user.full_name
end
```

and if you really* want to simplify things, shorten the above code like this:

```rb
column 'full_name', &:full_name
```

anyway, same goes for other actions. if you're allowing your admin panel the `show` action, then you can customize how the Show page will look compared to the Index view.

```rb
ActiveAdmin.register User do
  # ...
  show do
    attributes_table_for(resource) do
      column :email 
      # ...
    end
  end
end
```

note that as you build out Active Admin views, some syntax errors will kill your entire server and you'll need to restart it. that's because Active Admin is also responsible for "drawing" routes. if you've ever made a syntx error inside your `config/routes.rb` file, you'll also notice that these errors tend to shut down your server. just `bin/dev`, refresh your page, and keep going.