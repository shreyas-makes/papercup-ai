### Introduction

you can do a lot with Speedrail, but instead of asking you to imagine things i'd rather show you.

this page is a WIP (work in progress) but will highlight both general and specific examples of how to use Speedrail to build SaaS apps quickly.

**Table of Contents**

- [Fancy HTML Elements](#fancy-html-elements)
- [Branding and Styling](#branding-and-styling)

### Fancy HTML elements

nowadays, a handful of native HTML elements are being ignored by developers who want prettier web interfaces. one common example is the `<select>` element, which returns a list of dropdown items [like so](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select):

![html-select-native](https://github.com/ryanckulp/speedrail-docs/assets/3083888/c2e76a5c-faae-4007-b8e4-3b5c5a9d5695)

to prettify your own forms, check out [Flowbite](https://flowbite.com/docs/forms/select/) for less-than-native solutions:

![flowbite-select-example](https://github.com/ryanckulp/speedrail-docs/assets/3083888/69f512b0-47a3-4a68-96c7-69dc6a13cda9)

and if you prefer a full overhaul, the Tailwind UI (paid) library has even more customizable solutions:

![tailwind-ui-custom-select](https://github.com/ryanckulp/speedrail-docs/assets/3083888/57f159f5-e04e-4da1-80c6-5492ac91282b)

(*Flowbite and Tailwind are already included in Speedrail, so you don't need to install any extra code*)

### Branding and styling

for an 80/20 approach to making your app stand out *without* hiring a designer, consider modifying:

* fonts
* colors
* navigation

a case study of how far these small changes can go is [Git Paywall](https://gitpaywall.com), a product i built over a weekend in < 36 hours.

![git-paywall-lander-example](https://github.com/ryanckulp/speedrail-docs/assets/3083888/50fb55b2-f9a8-469b-81d3-e88997577620)

let's walk through how simple changes made a huge difference to the look and feel of this application.

**Fonts**

inside the Tailwind config file (`config/tailwind.config.js`) i replaced the default sans font with `ui-monospace`:

```js
fontFamily: {
  // before: sans: ['Inter var', ...defaultTheme.fontFamily.sans],
  sans: ['ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace']
```

**Colors**

here again we modify the Tailwind config file. since Speedrail leverages `primary` and `secondary` color identifiers, it's as simple as updating 1 location versus all of your HTML markup.

```js
colors: { // custom color palette for branding
        'primary': '#6495ed', // cornflowerblue
        'brand-hover': {
          '700': '#a4411c',
          '500': '#EA9A72'
        }
```

**Navigation**

the logged out navigation is top-right aligned, however the logged-in navigation is centered. tiny change, big difference.

![git-paywall-navigation-example](https://github.com/ryanckulp/speedrail-docs/assets/3083888/41c25166-e4da-4173-999f-cb907178dd38)

**All Together**

another great-looking app built with Speedrail is RIGD, a stock options alert platform. we moved the navigation to the left side, updated the fonts, and created a color scheme with [left-to-right gradients](https://v2.tailwindcss.com/docs/gradient-color-stops) inside most headers and buttons.

Sidebar with default + hover states (on hover, icons convert to full text labels)

![rigd-sidebar-closed](https://github.com/ryanckulp/speedrail-docs/assets/3083888/098adbb0-a642-4ba1-b63a-ab2bfce36b5a)

Sidebar expanded with gradient headers:

![rigd-gradient-headers](https://github.com/ryanckulp/speedrail-docs/assets/3083888/5b3dae5a-c832-4686-9f73-85d8c8ae7adf)




