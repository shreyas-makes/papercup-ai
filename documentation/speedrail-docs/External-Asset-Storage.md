### Why external asset storage?

for static content like marketing site graphics, the `assets/images` folder is perfect. 

but if you want users to upload avatars, or if you intend to write blog posts with inline content, you'll need separate storage.

this is for a few reasons, ranging from security to costs, and even scalability. in no particular order:

- security: many hacks/exploits involve uploading corrupt files that can navigate and manipulate applications, if uploaded to the same location as the source code.
- costs: services like AWS are much faster + cheaper at serving assets to visitors around the world than wherever your static server is located
- scalability: platforms like Heroku have maximum "slug" sizes allowed, which in Heroku's case is 500mb. even just a few large assets can make your application un-deployable.

inside `config/storage.yml`, notice the commented out `:amazon` section. un-comment this as instructed. now we need to provide a few values:

- access_key_id
- secret_access_key
- bucket location (us-west-2, us-east-1, etc)
- bucket name

### external asset storage in local development

the [24 Hour MVP](https://www.founderhacker.com/24-hour-mvp) course covers all this, so i'll assume you can create an S3 bucket inside AWS, then copy/paste a set of security credentials into your Rails credentials file.

but now you need to allow data to come from your server(s). so head back to AWS > S3 > click your bucket > Permissions:

![image](https://github.com/user-attachments/assets/90a0b92e-ec49-4eba-be76-143290dc3b5c)

scroll down to "Cross-origin resource sharing (CORS)" and click Edit. copy/paste the following:

```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "HEAD",
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:3000"
        ],
        "ExposeHeaders": []
    }
]
```

this assumes you run on localhost port 3000 locally. if you don't, change the AllowedOrigins item.

now you can test your production storage container locally. simply swap `config.active_storage.service = :local` for `config.active_storage.service = :amazon` (temporarily) inside your `config/environments/development.rb`, then restart your server.

as an Admin user, visit `/blog/new` and draft a blog post. upload a featured image, then drag/drop a couple more images into the blog post body itself. click save. on AWS > S3 > your bucket name > Objects, you should see those assets stored.

delete the blog post, and the assets should be removed from S3 momentarily.

### external asset storage in production

after you're up and running locally, you still need 1 more config to make asset storage work correctly on your production server.

after deploying, grab your URL (xxx.herouapp.com, vanitydomain.com, etc) and head back to AWS > S3 > click your bucket > Permissions. scroll down to "Cross-origin resource sharing (CORS)" and click Edit. underneath 'AllowedOrigins', input your domain as a new array item like so:

```
...
[
  "AllowedOrigins": [
    "https://YOURDOMAIN.com",
    "https://www.YOURDOMAIN.com"
   ]
   ...
]
```

i suggest inputting it with and without "www" for good measure. you should also delete the previously saved "http://localhost:3000" value.