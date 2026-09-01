# Innmotek V2 - Backend API Specification & Audit

> **Source Reference**: `innotek-backend-OLD` (Laravel 8) & `innmotekllp_admin.sql`  
> **Target**: `innmotek-backend-NEW` (Node.js / Express / Fastify / TypeScript)  
> **Audit Status**: Complete & Verified Against Source Code

---

## 1. Executive Summary & Architecture Overview

The legacy backend is built with **Laravel 8** and MySQL. All public frontend endpoints are defined in `routes/api.php` under the default `api` route group (which only applies throttle and binding middleware). Responses are consistently wrapped in a JSON envelope with `"result": "success"` (except where noted).

### Authentication & Middleware Audit
- **ApiKeyMiddleware**: **DOES NOT EXIST / NOT WIRED**.
- In `app/Http/Kernel.php`, the `$middlewareGroups['api']` only contains `'throttle:api'` and `SubstituteBindings::class`.
- The only authenticated route in `routes/api.php` is `GET /api/user` with `auth:api` (Laravel Passport / Sanctum).
- **All public content, catalogue, banner, blog, project, service, and category endpoints are completely unauthenticated**.
- In the new Node.js backend, these public endpoints will remain unauthenticated for frontend consumer queries, with rate limiting and optional API security headers.

### Image URL Storage & Transformation Pattern
In Eloquent models, images are stored as simple filenames (e.g. `uuid.webp` or `filename.jpg`) in the database column (e.g., `image`, `filename`, `seo_image`). Eloquent accessors dynamically build the full asset URL via `asset('/frontend/images/<folder>/' . $this->image)`.

| Model | Database Column | Asset Directory Path | Accessor Name |
|---|---|---|---|
| **Product** | `image` | `/frontend/images/products/` | `imageUrl` |
| **Image** (Product gallery) | `filename` | `/frontend/images/products/` | `filenameUrl` |
| **Category** | `image` | `/frontend/images/categories/` | `imageUrl` |
| **Blog** | `image`, `seo_image` | `/frontend/images/blogs/` | `imageUrl`, `seoImageUrl` |
| **BlogCategory** | `image`, `seo_image` | `frontend/images/blog_categories/` | `imageUrl`, `seoImageUrl` |
| **Brand** | `image` | `/frontend/images/brands/` | `imageUrl` |
| **Banner** | `image` | `/frontend/images/banners/` | `imageUrl` |
| **Testimonial** | `image` | `/frontend/images/testimonials/` | `imageUrl` |
| **Project** | `image` | `/frontend/images/projects/` | `imageUrl` |
| **ProjectImage** (Project gallery) | `filename` | `/frontend/images/projects/` | `filenameUrl` |
| **Service** | `image` | `/frontend/images/services/` | `imageUrl` |
| **Page** | `images`, `seo_image` | `/frontend/images/pages/` | `imageUrl`, `seoImageUrl` |

---

## 2. Complete Route-by-Route Specification

### 2.1 Plugins / Tracking Scripts
- **Route**: `GET /api/plugins`
- **Controller**: `App\Http\Controllers\Frontend\Plugin\PluginController@index`
- **SQL Table**: `plugins` (`status = 1`, `ORDER BY id DESC`)
- **Response Format**:
```json
{
  "result": "success",
  "plugins": [
    {
      "tag_type": "head | body | footer",
      "code": "<script>...</script>",
      "type": "google_analytics | pixel | custom"
    }
  ]
}
```

---

### 2.2 Testimonials
- **Route**: `GET /api/testimonials`
- **Controller**: `App\Http\Controllers\Frontend\Testimonial\TestimonialController@index`
- **SQL Table**: `testimonials` (`status = 1`, `ORDER BY id DESC`)
- **Response Format**:
```json
{
  "result": "success",
  "testimonials": [
    {
      "name": "string (full_name)",
      "company": "string | null (company_name)",
      "position": "string | null (position)",
      "message": "string (message)",
      "image": "string (URL) | null"
    }
  ]
}
```

---

### 2.3 Banners / Hero Sliders
- **Route**: `GET /api/banners`
- **Controller**: `App\Http\Controllers\Frontend\Banner\BannerController@index`
- **SQL Table**: `banners` (`status = 1`, `ORDER BY id DESC`)
- **Response Format**:
```json
{
  "result": "success",
  "banners": [
    {
      "title": "string",
      "image": "string (URL) | null"
    }
  ]
}
```

---

### 2.4 Blogs & Blog Categories
- **Route**: `GET /api/blogs`
  - **Query Params**: `limit` (optional integer)
  - **Controller**: `App\Http\Controllers\Frontend\Blog\BlogController@index`
  - **SQL Table**: `blogs` (`status = 1`, `ORDER BY id DESC`)
  - **Response Format**:
```json
{
  "result": "success",
  "blogs": [
    {
      "slug": "string",
      "title": "string",
      "summary": "string | null",
      "image": "string (URL) | null",
      "category": "string | null (joined from blog_categories.title)",
      "date": "string (formatted: 'd M, Y', e.g. '15 Jun, 2024')"
    }
  ]
}
```

- **Route**: `GET /api/blogs/{blog:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Blog\BlogController@show`
  - **SQL Table**: `blogs`, `blog_categories`
  - **Response Format**:
```json
{
  "result": "success",
  "blog": {
    "slug": "string",
    "title": "string",
    "summary": "string | null",
    "category": "string | null",
    "category_slug": "string | null",
    "description": "string (HTML/rich text)",
    "image": "string (URL)",
    "date": "string (formatted: 'd M, Y')"
  },
  "blogs": [
    {
      "slug": "string",
      "title": "string",
      "summary": "string | null",
      "image": "string (URL) | null",
      "category": "string | null",
      "date": "string (formatted: 'd M, Y')"
    }
  ],
  "categories": [
    {
      "title": "string",
      "slug": "string"
    }
  ]
}
```

- **Route**: `GET /api/blogs/categories/{blog_category:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Blog\BlogController@category`
  - **SQL Table**: `blogs`, `blog_categories`
  - **Response Format**:
```json
{
  "result": "success",
  "blogs": [
    {
      "slug": "string",
      "title": "string",
      "summary": "string | null",
      "image": "string (URL) | null",
      "category": "string | null",
      "date": "string (formatted: 'd M, Y')"
    }
  ],
  "category": {
    "title": "string",
    "slug": "string",
    "products": 0
  }
}
```

---

### 2.5 Brands
- **Route**: `GET /api/brands`
- **Controller**: `App\Http\Controllers\Frontend\Brand\BrandController@index`
- **SQL Table**: `brands` (`status = 1`, `ORDER BY id DESC`)
- **Response Format**:
```json
{
  "result": "success",
  "brands": [
    {
      "id": 1,
      "slug": "string",
      "title": "string",
      "image": "string (URL) | null"
    }
  ]
}
```

---

### 2.6 Categories & Category Trees
- **Route**: `GET /api/categories`
  - **Controller**: `App\Http\Controllers\Frontend\Category\CategoryController@index`
  - **SQL Table**: `categories` (`parent_category IS NULL`, `status = 1`, `ORDER BY order ASC`)
  - **Response Format**:
```json
{
  "result": "success",
  "categories": [
    {
      "slug": "string",
      "title": "string",
      "image": "string (URL) | null",
      "categories": 2,
      "subCategory": [
        {
          "slug": "string",
          "title": "string",
          "categories": 0,
          "childCategory": []
        }
      ]
    }
  ]
}
```

- **Route**: `GET /api/category/{category:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Category\CategoryController@show`
  - **SQL Table**: `categories` (fetching children where `parent_category = category.id`, `ORDER BY id ASC`)
  - **Response Format**:
```json
{
  "result": "success",
  "categories": [
    {
      "slug": "string",
      "title": "string",
      "image": "string (URL) | null",
      "description": "string | null",
      "categories": 0
    }
  ],
  "category": {
    "slug": "string",
    "title": "string",
    "parentLink": "string (parent category slug or '#')",
    "parentTitle": "string | null (parent category title)",
    "seo_title": "string | null",
    "seo_keyword": "string | null",
    "seo_description": "string | null"
  }
}
```

- **Route**: `GET /api/products/related/{category:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Category\CategoryController@category`
  - **SQL Table**: `categories`, `products` (products belonging to child categories of this category, `status = 1`, `ORDER BY title ASC`)
  - **Response Format**:
```json
{
  "result": "success",
  "products": [
    {
      "title": "string",
      "slug": "string",
      "summary": "string | null",
      "image": "string (URL) | null"
    }
  ]
}
```

---

### 2.7 Products
- **Route**: `GET /api/products/{category:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Product\ProductController@index`
  - **SQL Table**: `products` (`category_id = category.id`, `status = 1`, `ORDER BY title ASC`)
  - **Response Format**:
```json
{
  "result": "success",
  "products": [
    {
      "title": "string",
      "slug": "string",
      "summary": "string | null",
      "image": "string (URL) | null"
    }
  ],
  "category": {
    "slug": "string",
    "title": "string",
    "parentLink": "string (parent category slug or '#')",
    "parentTitle": "string | null",
    "seo_title": "string | null",
    "seo_keyword": "string | null",
    "seo_description": "string | null"
  }
}
```

- **Route**: `GET /api/products/{product:slug}/show` *(Note: Frontend calls both `/api/products/{slug}/show` and `/api/products/{slug}`)*
  - **Controller**: `App\Http\Controllers\Frontend\Product\ProductController@show`
  - **SQL Table**: `products`, `categories`, `images`
  - **Response Format**:
```json
{
  "result": "success",
  "product": {
    "slug": "string",
    "title": "string",
    "description": "string (HTML/rich text) | null",
    "summary": "string | null",
    "warrenty": "string | null",
    "specification": "string (HTML/rich text/table) | null",
    "installation": "string | null",
    "image": "string (URL) | null",
    "seo_title": "string | null",
    "seo_keyword": "string | null",
    "seo_description": "string | null",
    "images": [
      {
        "id": 1,
        "image": "string (URL) | null",
        "slug": "string"
      }
    ]
  },
  "products": [
    {
      "title": "string",
      "slug": "string",
      "summary": "string | null",
      "image": "string (URL) | null"
    }
  ]
}
```

- **Route**: `GET /api/featured/products`
  - **Controller**: `App\Http\Controllers\Frontend\Product\FeaturedController@index`
  - **SQL Table**: `products`
  - **Response Format**:
```json
{
  "result": "success",
  "products": [
    {
      "title": "string",
      "slug": "string (e.g. '/dehumidifier', '/robotic-pool-cleaner', '/products/Swimming-pool-heat-pump-pbhp-0021-sp', '/products/split-heat-pump-heater-pbhw-0076-s')",
      "summary": "string | null",
      "image": "string (URL) | null"
    }
  ]
}
```

---

### 2.8 Projects
- **Route**: `GET /api/projects`
  - **Controller**: `App\Http\Controllers\Frontend\Project\ProjectController@index`
  - **SQL Table**: `projects` (`status = 1`, `ORDER BY id DESC`)
  - **Response Format**:
```json
{
  "result": "success",
  "projects": [
    {
      "slug": "string",
      "title": "string",
      "image": "string (URL) | null"
    }
  ]
}
```

- **Route**: `GET /api/projects/{project:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Project\ProjectController@show`
  - **SQL Table**: `projects`, `project_images`
  - **Response Format**:
```json
{
  "result": "success",
  "project": {
    "slug": "string",
    "title": "string",
    "description": "string (HTML/rich text) | null",
    "location": "string",
    "website": "string | null",
    "date": "string (formatted: 'd M, Y')",
    "images": [
      {
        "id": 1,
        "image": "string (URL) | null",
        "slug": "string"
      }
    ],
    "image": "string (URL) | null",
    "seo_title": "string | null",
    "seo_keyword": "string | null",
    "seo_description": "string | null"
  }
}
```

---

### 2.9 Services
- **Route**: `GET /api/services`
  - **Controller**: `App\Http\Controllers\Frontend\Service\ServiceController@index`
  - **SQL Table**: `services` (`status = 1`, `ORDER BY id DESC`)
  - **Response Format**:
```json
{
  "result": "success",
  "services": [
    {
      "slug": "string",
      "title": "string",
      "image": "string (URL) | null"
    }
  ]
}
```

- **Route**: `GET /api/services/{service:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Service\ServiceController@show`
  - **SQL Table**: `services`
  - **Response Format**:
```json
{
  "result": "success",
  "service": {
    "slug": "string",
    "title": "string",
    "description": "string (HTML/rich text)",
    "summary": "string | null",
    "image": "string (URL) | null",
    "seo_title": "string | null",
    "seo_keyword": "string | null",
    "seo_description": "string | null"
  }
}
```

---

### 2.10 FAQs
- **Route**: `GET /api/faqs`
  - **Controller**: `App\Http\Controllers\Frontend\Faq\FaqController@index`
  - **SQL Table**: `faq_types`, `faqs` (`faq_types.status = 1`, `faqs.status = 1`)
  - **Response Format**:
```json
{
  "result": "success",
  "types": [
    {
      "title": "string (FAQ Category Title)",
      "faqs": [
        {
          "question": "string",
          "answer": "string (HTML / text)"
        }
      ]
    }
  ]
}
```

---

### 2.11 Static/Policy Pages
- **Route**: `GET /api/pages/{page:slug}`
  - **Controller**: `App\Http\Controllers\Frontend\Page\PageController@show`
  - **SQL Table**: `pages`
  - **Status / Bug Alert**: In the legacy Laravel backend, `PageController@show` calls `get_api_backend_page($page)`, which is **undefined** in any helper file.
  - **Standardized Response Specification for Node.js Backend**:
```json
{
  "result": "success",
  "page": {
    "slug": "string",
    "title": "string",
    "description": "string (HTML/rich text) | null",
    "image": "string (URL) | null",
    "seo_title": "string | null",
    "seo_keyword": "string | null",
    "seo_description": "string | null"
  }
}
```

---

## 3. Database Schema Reference (`innmotekllp_admin.sql`)

Total Tables: **31**

| Table Name | Description | Key Columns & Types | Relationships |
|---|---|---|---|
| `users` | Admin & system users | `id` (PK, bigint), `name` (varchar), `email` (varchar), `password` (varchar), `phone_number` (varchar), `image` (varchar) | 1-to-many with most entities (`user_id`) |
| `categories` | Product & system categories | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `parent_category` (int null), `image` (varchar), `description` (text), `order` (int), `status` (int), `seo_title`, `seo_description`, `seo_keyword` | Self-referential hierarchy (`parent_category` -> `categories.id`), 1-to-many with `products` |
| `products` | Product catalogue | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `category_id` (int), `brand_id` (int null), `image` (varchar), `description` (longtext), `summary` (longtext), `warrenty` (longtext), `specification` (longtext), `installation` (longtext), `download` (longtext), `featured_product` (int), `status` (int), `seo_title`, `seo_description`, `seo_keyword` | Belongs to `categories.id`, belongs to `brands.id`, 1-to-many with `images` |
| `images` | Product gallery images | `id` (PK, bigint), `slug` (varchar), `user_id` (int), `product_id` (int), `filename` (varchar) | Belongs to `products.id` |
| `brands` | Partner/manufacturer brands | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `image` (varchar), `status` (int) | Referenced by `products.brand_id` |
| `banners` | Hero & promo banners | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `image` (varchar), `status` (int) | Belongs to `users.id` |
| `blogs` | Blog articles | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `category_id` (int), `user_id` (int), `image` (varchar), `description` (longtext), `summary` (longtext), `status` (int), `seo_title`, `seo_description`, `seo_keyword`, `seo_image` | Belongs to `blog_categories.id` |
| `blog_categories` | Categories for blogs | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `image` (varchar), `description` (longtext), `status` (int), `seo_title`, `seo_description`, `seo_keyword`, `seo_image` | 1-to-many with `blogs.category_id` |
| `projects` | Case studies & portfolio | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `image` (varchar), `description` (longtext), `website` (varchar), `date` (varchar), `location` (varchar), `status` (int), `seo_title`, `seo_description`, `seo_keyword` | 1-to-many with `project_images.project_id` |
| `project_images` | Project gallery images | `id` (PK, bigint), `slug` (varchar), `user_id` (int), `project_id` (int), `filename` (varchar) | Belongs to `projects.id` |
| `services` | Offered services & solutions | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `description` (longtext), `summary` (longtext), `image` (varchar), `status` (int), `seo_title`, `seo_keyword`, `seo_description` | Belongs to `users.id` |
| `faq_types` | FAQ category groups | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `status` (int) | 1-to-many with `faqs.type_id` |
| `faqs` | Questions & answers | `id` (PK, bigint), `slug` (varchar), `type_id` (int), `user_id` (int), `question` (longtext), `answer` (longtext), `status` (int) | Belongs to `faq_types.id` |
| `testimonials` | Client reviews | `id` (PK, bigint), `slug` (varchar), `user_id` (int), `full_name` (varchar), `company_name` (varchar), `position` (varchar), `image` (varchar), `message` (longtext), `status` (int) | Belongs to `users.id` |
| `pages` | CMS static pages | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `images` (varchar), `description` (longtext), `summary` (longtext), `seo_title`, `seo_description`, `seo_keyword`, `seo_image`, `status` (int) | Belongs to `users.id` |
| `plugins` | Script injections / tags | `id` (PK, bigint), `slug` (varchar), `user_id` (int), `tag_type` (varchar), `code` (longtext), `type` (varchar), `status` (int) | Belongs to `users.id` |
| `contact_forms` | Contact inquiries | `id` (PK, bigint), `slug` (varchar), `first_name` (varchar), `last_name` (varchar), `email` (varchar), `phone_number` (varchar), `message` (longtext), `status` (int) | Standalone form submissions |
| `catalogues` | Downloadable brochures | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `user_id` (int), `file` (varchar), `image` (varchar), `status` (int) | Downloadable PDF catalogue records |
| `subscribers` | Newsletter emails | `id` (PK, bigint), `slug` (varchar), `email` (varchar), `status` (int) | Standalone subscribers |
| `complains` | Customer complaints | `id` (PK, bigint), `slug` (varchar), `type_id` (int), `user_id` (int), `first_name`, `last_name`, `email`, `phone_number`, `invoice_no`, `message`, `status` | Belongs to `complain_types.id` |
| `complain_types` | Complaint categories | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `status` (int) | 1-to-many with `complains` |
| `job_lists` | Careers / Job openings | `id` (PK, bigint), `slug` (varchar), `title` (varchar), `description` (longtext), `specification` (longtext), `deadline` (varchar), `status` (int) | 1-to-many with `candidates` |
| `candidates` | Job applications | `id` (PK, bigint), `slug` (varchar), `job_id` (int), `first_name`, `last_name`, `email`, `phone_number`, `resume`, `message`, `status` | Belongs to `job_lists.id` |
| `roles`, `permissions`, `model_has_roles`, `role_has_permissions`, `model_has_permissions` | RBAC ACL | Spatie Permission tables | Spatie RBAC tables for CMS |
| `failed_jobs`, `migrations`, `password_resets` | Framework system tables | Standard Laravel migration and queue tables | System internals |

---

## 4. Legacy Backend Bugs & Audit Findings

1. **`GET /api/pages/{page}` Broken Method**:
   - `PageController@show` references `get_api_backend_page($page)`, which does not exist in any file. This threw a PHP fatal error in the legacy backend.
   - Fixed in specification above with clean payload formatting.
2. **`CategoryController@category` / Product subquery issue**:
   - `$child_category = \App\Models\Category::whereIn('parent_category', $category)->pluck('id');` passed the entire `$category` model instance into `whereIn()`.
   - Fixed in Node.js specification: query children where `parent_category = category.id`.
3. **Hardcoded Featured Products**:
   - `FeaturedController@index` hardcoded 4 specific titles/slugs instead of querying a `featured_product = 1` flag.
   - In Node.js backend: support both dynamic `featured_product = 1` and explicit featured slugs fallback.
