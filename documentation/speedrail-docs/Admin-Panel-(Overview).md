### Introduction

admin panels can do anything you want. from a customer service portal, to "god boards" with charts and graphs, or simply a glorified interface on top your database. 

**we'll focus on the latter -- an interactive place for you, the admin, to view and update records**.

![active-admin-users-example](https://github.com/ryanckulp/speedrail-docs/assets/3083888/cb0649bf-1114-4fc6-a917-8a301b2148e0)

for your MVP, think of the admin panel as a safer way to use Rails Console in production.

### Why use a gem? Why use Active Admin?

suppose you want to build a custom admin panel, which Speedrail [used to provide](https://github.com/ryanckulp/speedrail/commit/faf69f8e4b8ce3c79e423f910739a9998e92e7a0). you'll need routes, controllers, views, and probably some helpers + callbacks to ensure admin-driven behaviors don't corrupt user facing data.

this translates to 3-10 new files per database table you want to manage, and that's a lot of new code to maintain. this also assumes your admin panel code has no bugs, and doesn't need new functionality on a frequent basis.

enter Active Admin (+ other gems like it). by using a gem to develop admin panels, you get all the MVC components with a single file of code. this is thanks to Active Admin's DSL, or domain specific language, which we previewed [here](https://github.com/ryanckulp/speedrail-docs/wiki/Getting-Started#deciding-which-admin-panel-to-use).

now let's jump into common outcomes you'll want from your admin panel.

### Tutorials

- [How to create an admin panel (table backed)](https://github.com/ryanckulp/speedrail-docs/wiki/Admin-Panel-%E2%80%90-How-to-create-a-new-page-(table-backed))
- [How to create an admin panel (custom content)](https://github.com/ryanckulp/speedrail-docs/wiki/Admin-Panel-%E2%80%90-How-to-create-a-new-page-(custom-content))
- [How to create custom functions](https://github.com/ryanckulp/speedrail-docs/wiki/Admin-Panel-%E2%80%90-How-to-create-custom-functions)
- (COMING SOON) Interactive charts with SaaS metrics, user activity, etc
- (COMING SOON) Adding custom navigation links
- (COMING SOON) Overriding admin panel CSS styles

### More Documentation

the official Active Admin docs are [here](https://activeadmin.info/), but can be painful to navigate. for help understanding a feature, post in the [Discussions forum](https://github.com/ryanckulp/speedrail-docs/discussions).