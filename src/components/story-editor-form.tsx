"use client";

import { LoaderCircle, Save, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { saveStory, type ActionState } from "@/lib/actions/stories";
import type { CategorySummary, StoryDetail } from "@/lib/data/types";

interface StoryEditorFormProps {
  categories: CategorySummary[];
  story?: StoryDetail & { categoryIds?: string[] };
}

const initialState: ActionState = {};

export function StoryEditorForm({ categories, story }: StoryEditorFormProps) {
  const [state, action, pending] = useActionState(saveStory, initialState);
  const [content, setContent] = useState(story?.content ?? "");

  return (
    <form action={action} className="space-y-8">
      {story && <input type="hidden" name="storyId" value={story.id} />}
      <input type="hidden" name="content" value={content} />

      <section className="space-y-4">
        <label className="block">
          <span className="sr-only">Story title</span>
          <textarea
            name="title"
            rows={2}
            required
            maxLength={140}
            defaultValue={story?.title ?? ""}
            placeholder="Story title"
            className="w-full resize-none border-0 bg-transparent font-serif text-4xl font-bold leading-tight outline-none placeholder:text-foreground/25 sm:text-5xl"
          />
          {state.fieldErrors?.title?.[0] && (
            <span className="mt-1 block text-sm text-red-600">
              {state.fieldErrors.title[0]}
            </span>
          )}
        </label>

        <label className="block">
          <span className="sr-only">Summary</span>
          <textarea
            name="summary"
            rows={2}
            maxLength={280}
            defaultValue={story?.summary ?? ""}
            placeholder="Add a short summary that helps readers know what to expect…"
            className="w-full resize-none border-0 bg-transparent text-lg leading-relaxed text-muted outline-none placeholder:text-muted/60"
          />
        </label>
      </section>

      <RichTextEditor value={content} onChange={setContent} />
      {state.fieldErrors?.content?.[0] && (
        <p className="text-sm text-red-600">{state.fieldErrors.content[0]}</p>
      )}

      <section className="rounded-xl border border-border bg-surface-muted p-5">
        <h2 className="font-semibold">Story settings</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Cover image URL</span>
            <input
              name="coverImage"
              type="url"
              defaultValue={story?.coverImage ?? ""}
              placeholder="https://…"
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface px-3 outline-none focus:border-ring"
            />
            {state.fieldErrors?.coverImage?.[0] && (
              <span className="mt-1 block text-xs text-red-600">
                {state.fieldErrors.coverImage[0]}
              </span>
            )}
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Categories (up to 5)</legend>
            <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    defaultChecked={story?.categoryIds?.includes(category.id)}
                    className="peer sr-only"
                  />
                  <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-xs peer-checked:border-accent peer-checked:bg-green-50 peer-checked:text-accent">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="sticky bottom-4 z-20 flex items-center justify-end gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
        <Button
          type="submit"
          name="status"
          value="draft"
          variant="outline"
          disabled={pending}
        >
          <Save size={17} /> Save draft
        </Button>
        <Button
          type="submit"
          name="status"
          value="published"
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Send size={17} />
          )}
          Publish
        </Button>
      </div>
    </form>
  );
}
