# Blog Pagination Partial Component

A simplepagination component for blog post listings with previous/next navigation and numbered page links.

## Data Structure

Blog pagination data is generated automatically from the `pagination` data generated with the `metalsmith-simple-pagination` plugin. The pagination data allows the construction of the index page with the following structure ( for page 2 of 3):

```json
{
    "name": "blog",
    "num": 2,
    "total": 3,
    "pages": 3,
    "files": "[ array with file objects to list on this page ]",
    "next": "/blog/3/",
    "previous": "/blog/",
    "first": "/blog/",
    "last": "/blog/3/",
    "usePermalinks": true
}
```


## HTML Output

On blog index page 3

```html
<ul class="pagination">
    <li><a href="/blog/" class="pagination-relative">First</a></li>
    <li><a href="/blog/" class="pagination-relative">Prev</a></li>
    <li><a href="/blog/">1</a></li>
    <li><a href="/blog/2/"  class="current">2</a></li>
    <li><a href="/blog/3/">3</a></li>
    <li><a href="/blog/3/" class="pagination-relative">Next</a></li>
    <li><a href="/blog/3/" class="pagination-relative">Last</a></li>
  </ul>
```

## Template Usage

```nunjucks
{% from "components/_partials/blog-pagination/blog-pagination.njk" import blogPagination %}
{{ blogPagination(pagination) }}
```

## Features

- **Previous/Next Navigation**: Arrow-based navigation with disabled states
- **Numbered Pages**: Shows all page numbers with current page highlighted
- **Disabled States**: Visual indication for unavailable navigation options
- **Semantic HTML**: Proper link structure for accessibility
