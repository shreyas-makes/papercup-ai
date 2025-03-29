i planned a coupule videos on this subject but the following article does an excellent job explaining:
https://medium.com/@princepatidar342/mastering-custom-filters-in-active-admin-for-rails-applications-69ddc37ad1c7

**TL;DR:**

1. ActiveRecord ships with the ability to define sidebar-based filters with `filter :attr_name` inside the resource file
2. these filters are nice but limiting -- what if you need to filter by a parent object attributes (like a Store's owner email)?
3. in addition to parent / child filtering, we also may need to constrain or enhance a filter, for example with a dropdown of options versus open text fields

the Medium post above outlines all these use cases, which are incredibly helpful for expanding your admin panel capabilities with minimal code changes

**troubleshooting*

when defining a new filter, you may see error messages in your web browser regarding "ransackable attributes." this is an annoying but security-minded feature of ActiveAdmin that requires you to explicitly allow attributes to be accessed in your admin panel. these attributes are whitelisted from your relevant Model files. so when you see these errors, just follow the instructions to amend your Model-level class methods. for example:

```rb
# user model 

def self.ransackable_attributes(*)
  ["id", "admin", "created_at", "updated_at", "email", "stripe_customer_id", "stripe_subscription_id", "paying_customer"]
end
```

these are the default attributes inside a Speedrail project, User table. so if you add a new field like `first_name`, and want to add `filter :first_name` inside `app/admin/users.rb`, you'll need to append `"user"` to the array of allowed attributes inside the class function above.