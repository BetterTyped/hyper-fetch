# Examples

To run examples use:

```bash
yarn start:app {APP_NAME}
```

### Example

```bash
yarn start:app react-app

yarn start:app next-app

yarn start:app next-app-router
```

## Adding new example

To add new example use the @nx/cli command:

```bash
yarn nx g app
```

> [!IMPORTANT]  
> After generation of the application, remove it's targets `build` step from examples/{new-app}/project.json.
