// Assemble des noms de classes conditionnels sans dépendre du format TypeScript de lib/utils.
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
