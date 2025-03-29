### Introduction

suppose you have a table called Widgets, with a function called `reset!` inside your Widget model that does a handful of tasks. perhaps it changes the widget's color, name, and stat collection settings back to some defaults.

as an admin, you want to invoke this `reset!` function from your Admin > Widgets view, versus using the Rails Console on your production server. not only is this safer, it's also impossible to invoke code functions from your mobile device when you host on platforms like Heroku.

### Defining functions

first determine if this custom functionality is useful outside of your admin panel. for example, would a background job or script ever need to invoke `record.custom_function` or `CustomService.call`? 

if so, first go and define that service or function elsewhere. otherwise, you'll have to duplicate this logic throughout your app as you cannot access Admin Panel defined code from other classes. at least, not without hacking how it's supposed to work.

### Exposing function in the admin panel

in this video i walk through creating 2 types of functions -- one via a simple link click (GET request), and the other via submitting a form that uses a PATCH request.

https://www.loom.com/share/3ee64361b50049dbb2df9b943339a9dc?sid=8a98fc0e-cbf8-4f8a-bcf9-2d037113f112
