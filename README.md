# Shopify Theme Nowmade Development Guide

[Getting Started](#getting-started) |
[Development Workflow](#development-workflow) |
[SCSS and BEM Methodology](#scss-and-bem-methodology) |
[Responsive Images](#responsive-images) |
[Responsive Design](#responsive-design) |
[JavaScript Practices](#javascript-practices) |
[Version Control](#version-control) |
[Contributing](#contributing) |
[License](#license)

This guide outlines the best practices and workflows for developing Shopify themes, ensuring performance, flexibility, and adherence to Shopify's Online Store 2.0 features.

## Getting Started

To begin developing Shopify themes efficiently, follow these initial steps:

1. **Install Shopify CLI**: Utilize the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) to streamline your development process, allowing for local theme development and management.

2. **Set Up Development Environment**:
   - **Clone the Repository**: Clone your theme repository to your local machine.
   - **Install Dependencies**: Navigate to your theme directory and install necessary dependencies using `npm install`.

3. **Configure Store Settings**:
   - **`config.yml`**: Set your store handle (e.g., `https://admin.shopify.com/stores/your-store-handle`) and your `dev_theme_id` obtained from running `shopify theme dev` initially. This configuration facilitates the use of `.vscode/tasks.json` for theme management.

## Development Workflow

Adhering to a structured workflow enhances productivity and code quality:

- **Development Mode**: Always work in development mode using Shopify CLI to preview changes locally before pushing them to the live store.

- **Version Control**: Commit your code changes with descriptive messages at the end of each session, and push to a dedicated Git branch. This practice maintains a clean commit history and facilitates code reviews.

- **SCSS Compilation**: Use Gulp to automatically compile SCSS files into `/assets/*.css`. After installing `node_modules` from `package.json`, simply run the `gulp` command in your terminal to start the compilation process.

- **VSCode Extensions**: Ensure all required VSCode extensions are listed in `.vscode/extensions.json`. You can install them collectively to maintain a consistent development environment.

## SCSS and BEM Methodology

Maintain organized and scalable stylesheets by following these guidelines:

- **BEM Convention**: Adopt the Block-Element-Modifier (BEM) naming convention for CSS classes to enhance readability and maintainability.

- **SCSS Structure**: Structure your SCSS files modularly, with separate files for each component or section.

- **Responsive Mixins**: Utilize the `respond-to` mixin from `/scss/mixins.scss` to handle media queries and ensure a responsive design.

## Responsive Images

Optimize image handling for various devices:

- **Responsive Image Snippet**: Use the `/snippets/responsive-image.liquid` snippet to serve appropriately sized images based on the user's device, improving load times and performance.

## Responsive Design

Ensure your theme is accessible and visually appealing across all devices:

- **Mobile-First Approach**: Design your styles with a mobile-first mindset, using media queries to adjust layouts for larger screens.

- **Media Queries**: Implement responsive design using the following SCSS mixin:

  ```scss
  /* Define the breakpoints */
  $breakpoints: (
    sm: 500px,
    md: 768px,
    ml: 980px,
    l: 1080px,
    xl: 1200px,
    xxl: 1440px,
    wide: 1600px,
  );

  // Mixin for media queries
  @mixin respond-to($breakpoint, $max-breakpoint: null) {
    $min-value: map-get($breakpoints, $breakpoint);
    $max-value: if($max-breakpoint, map-get($breakpoints, $max-breakpoint), null);

    // Handle min-width only
    @if $min-value and $max-value == null {
      @media (min-width: #{$min-value}) {
        @content;
      }
    }

    // Handle min-width and max-width (range)
    @else if $min-value and $max-value {
      @media (min-width: #{$min-value}) and (max-width: #{$max-value - 1}) {
        @content;
      }
    }

    // Handle max-width
    @else if $min-value == null and $max-value {
      @media (max-width: #{$max-value - 1}) {
        @content;
      }
    }
    // Throw error if breakpoint is invalid
    @else {
      @error "Breakpoint '#{$breakpoint}' or '#{$max-breakpoint}' is not defined in $breakpoints.";
    }
  }
  ```

## JavaScript Practices

Enhance functionality while maintaining performance:

- **Custom Elements**: Utilize JavaScript Custom Elements with the `connectedCallback` method for encapsulated and reusable components.

- **Swiper Integration**: For implementing sliders, reference the `/assets/swiper.js` file. Avoid inline JavaScript code; instead, maintain clean and modular scripts.

## Version Control

Maintain code integrity and collaboration:

- **Git Workflow**: Use Git for version control, committing changes with clear messages, and pushing to dedicated branches. This practice facilitates code reviews and collaboration.

## Contributing

We welcome contributions to improve this project. Please read our [contributing guide](/.github/CONTRIBUTING.md) to understand our development process, how to propose bug fixes and improvements, and how to build and test your changes effectively.

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE.md) file for more details.

---

By following this guide, you ensure that your Shopify theme development process is efficient, maintainable, and aligned with industry best practices. 