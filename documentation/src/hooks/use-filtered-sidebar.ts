const skipPages = ["props", "theming"];

export const getDocName = (item) => {
  if (item.label === "index") {
    const label = item.href.split("/");
    const name = label.reverse().find(Boolean);
    return {
      ...item,
      label: name,
    };
  }
  return item;
};

export const pickName = (categories) => {
  return categories.map((category) => {
    return {
      ...category,
      items: category.items?.map(getDocName),
    };
  });
};

const skipItems = (categories) => {
  return categories
    .filter((category) => {
      return !category.docId || !skipPages.some((page) => category.docId?.includes(page));
    })
    .map((category) => {
      const newItems = category.items ? skipItems(category.items) : [];
      const hasChildren = !!newItems.length;
      const collapsible = hasChildren ? category.collapsible : undefined;
      const collapsed = hasChildren ? category.collapsed : undefined;
      const type = hasChildren ? category.type : "link";

      return category.items ? { ...category, items: newItems, collapsible, collapsed, type } : category;
    });
};

export const useFilteredSidebar = (items) => {
  return pickName(skipItems(items));
};
