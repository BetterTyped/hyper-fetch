# ⚡️ HyperFetch Shop Example

This example application showcases the powerful features of HyperFetch in a real-world scenario. It's a simple shop
interface that demonstrates how to build fast, responsive, and data-intensive applications with ease.

## ✨ Features

### 1. **Prefetching for Instant Navigation**

When you hover over a product in the list, the application automatically prefetches its details in the background. When
you click on the product to view its full page, the data is already available, resulting in an incredibly fast, close to
instantaneous, loading experience. This showcases how HyperFetch can be used to anticipate user actions and optimize
data loading for a superior user experience.

### 2. **Real-time Database with Firebase**

The shop is connected to a real-time Firebase database. This means that any changes made in the Firebase dashboard, such
as adding a new product or updating an existing one, are reflected in the application instantly without needing to
refresh the page. This demonstrates HyperFetch's capability to integrate with real-time data sources and keep the UI
perfectly in sync with the backend.

### 3. **Smart Caching**

The application leverages HyperFetch's caching capabilities to avoid unnecessary network requests. Fetched data is
cached, so subsequent requests for the same data are served from the cache, making the application faster and more
efficient.

## 🚀 Getting Started

1.  Navigate to the example directory:
    ```bash
    cd examples/shop
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

Now you can open your browser and see the shop example in action!
