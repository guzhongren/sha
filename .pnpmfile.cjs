// ponytail: remove sharp optional dep — no Image component usage
function readPackage(pkg, _context) {
  if (pkg.name === "astro" && pkg.optionalDependencies) {
    delete pkg.optionalDependencies.sharp;
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
