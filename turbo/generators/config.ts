import type { PlopTypes } from "@turbo/gen";

const isKebabCase = (s: string): boolean => {
  const pattern = /(\w+)-(\w)([\w-]*)/;
  return pattern.test(s) && !s.includes("_");
};

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // create a generator
  plop.setGenerator("applet", {
    description: "creates a new pixiedust applet",
    // gather information from the user
    prompts: [
      {
        type: "input",
        name: "name",
        message: 'Kebab-cased name for the applet (example: "my-applet")',
        validate: (input) => {
          if (typeof input !== "string") {
            return "Name must be a string.";
          }
          if (!isKebabCase(input)) {
            return 'Name must be in Kebab case (example: "my-applet")';
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "Description of the applet",
      },
      {
        type: "input",
        name: "author",
        message: "Author",
      },
    ],
    // perform actions based on the prompts
    actions: [
      {
        type: "add",
        path: "pixiedust-applets/{{name}}/package.json",
        templateFile: "templates/package.json.hbs",
      },
      {
        type: "add",
        path: "pixiedust-applets/{{name}}/README.md",
        templateFile: "templates/README.md.hbs",
      },
      {
        type: "add",
        path: "pixiedust-applets/{{name}}/index.ts",
        templateFile: "templates/index.ts.hbs",
      },
    ],
  });
}
