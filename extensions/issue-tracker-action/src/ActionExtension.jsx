import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { getIssues, updateIssues } from "./utils";

function generateId (allIssues) {
  return !allIssues?.length ? 0 : allIssues[allIssues.length - 1].id + 1;
};

function validateForm ({title, description}) {
  return {
    isValid: Boolean(title) && Boolean(description),
    errors: {
      title: !title,
      description: !description,
    },
  };
};

// The target is set in ./shopify.extension.toml. Shopify calls this default export for that target.
export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  // `shopify` is a global that exposes the extension's APIs (replaces useApi)
  const { close, data } = shopify;
  const [issue, setIssue] = useState({ title: "", description: "" });
  const [allIssues, setAllIssues] = useState([]);
  const [formErrors, setFormErrors] = useState(null);
  const { title, description } = issue;

  useEffect(() => {
    getIssues(data.selected[0].id).then(issues => setAllIssues(issues || []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = useCallback(async () => {
    const {isValid, errors} = validateForm(issue);
    setFormErrors(errors);

    if (isValid) {
      // Commit changes to the database
      await updateIssues(data.selected[0].id, [
        ...allIssues,
        {
          id: generateId(allIssues),
          completed: false,
          ...issue,
        }
      ]);
      // Close the modal using the 'close' API
      close();
    }
  }, [issue, data.selected, allIssues, close]);

  return (
    <s-admin-action heading="Create an issue">
      <s-text-field
        value={title}
        error={formErrors?.title ? "Please enter a title" : undefined}
        onInput={(event) =>
          setIssue((prev) => ({ ...prev, title: event.currentTarget.value }))
        }
        label="Title"
        maxLength={50}
      />
      <s-box paddingBlockStart="large">
        <s-text-area
          value={description}
          error={
            formErrors?.description ? "Please enter a description" : undefined
          }
          onInput={(event) =>
            setIssue((prev) => ({ ...prev, description: event.currentTarget.value }))
          }
          label="Description"
          maxLength={300}
        />
      </s-box>
      <s-button slot="primary-action" onClick={onSubmit}>Create</s-button>
      <s-button slot="secondary-actions" onClick={close}>Cancel</s-button>
    </s-admin-action>
  );
}
