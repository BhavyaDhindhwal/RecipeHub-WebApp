// A recipe is publicly visible only when it is approved (or legacy, without a
// status field) and has not been soft-removed by an admin.
const publicRecipeFilter = () => ({
  isRemoved: { $ne: true },
  status: { $nin: ["pending", "rejected"] },
});

module.exports = { publicRecipeFilter };
