# Class Spreadsheet — User Manual

This spreadsheet is the home of every class we offer. The website reads
its information from here, so whatever is correct in this spreadsheet
will be correct on the website: https://cpc-classes-poc.netlify.app/classes/

## The tabs, and which ones you use

**Form Responses 1** — this is where the class submission form drops
its raw answers. Please never type in this tab. It belongs to the form,
and you will never need to look at it.

**Offerings** — one row per class. This is where you work.

**Sessions** — one row per class date. You normally don't need to touch
this tab either; the edit window (described below) manages it for you.

## The Review menu

A few seconds after you open the spreadsheet, a menu called **Review**
appears in the menu bar, next to Help. Everything you do happens
through this menu. If you don't see it yet, give it a moment — it loads
after the spreadsheet does.



![review-menu](/Users/wernerglinka/Documents/Projects/metalsmith/TESTS/class-poc/docs/images/review-menu.jpg)



## Editing a class

1. Go to the **Offerings** tab and click any cell in the row of the
   class you want to change.
2. Choose **Review → Open edit modal**. A large editing window opens
   with every detail of the class laid out in labeled fields.
3. Change whatever needs changing. Long text boxes grow to fit their
   content, and you can drag their bottom edge to make them bigger.
4. The class dates appear at the bottom under **Sessions**. You can
   correct a date or time, add a session with the **Add session**
   button, or remove one with the ✕. If someone has already signed up
   to host a session, that's shown next to the date, and you'll be
   asked to confirm before removing it.
5. Click **Submit** to save, or **Cancel** to close without changing
   anything.

A note about the orange hints: if you type something the spreadsheet
finds odd — letters where a price should be, a date in an unusual
format — a small orange note appears under the field. It's advice, not
a roadblock. You can always submit anyway, and common date and time
formats are tidied up automatically when you save.

## Adding a new class (without the form)

Most classes arrive through the submission form, but you can also enter
one directly:

1. Choose **Review → Add new class**. The same editing window opens,
   empty.
2. Fill in the details. Only the **class title is required** — the
   spreadsheet builds the class's internal ID from it. Everything else
   can be added later.
3. Add the session dates at the bottom.
4. Click **Submit**. The class appears as a new row in Offerings, its
   sessions appear in the Sessions tab, and its ID and submission date
   are filled in automatically.

## Weekly drop-in classes (like yoga)

Some classes repeat every week and have no fixed dates. For these, set
**Schedule type** to `recurring` in the edit window and fill in the
recurring day and start/end times (like `12:00` and `13:00`). Leave the
Sessions list at the bottom empty — the website shows "Every Friday,
12:00 PM - 1:00 PM" instead of a date list. If a week is skipped
(a holiday, say), add that date to **Recurring: skip dates** as
`2026-07-03` and the website will say so.

If students simply show up and pay at class instead of registering
online, also set **Registration type** to `walk-in`. The class page
then shows the fee and a "how to join" note instead of a Register
button.

## Rows with a reddish background

When you open the spreadsheet, any class whose dates have **all
passed** is shaded light red in the Offerings tab. Nothing has been
deleted or changed — it's simply a flag that the class is over, so you
can decide what to do with it:

- **Keep it** as a record. That's fine; it just stays shaded.
- **Take it off the website** by clearing the **approved** cell in that
  row (delete the "yes"). The class disappears from the site the next
  time it's published.

If you fix a date or add a future session, the shading clears the next
time it runs. To re-check at any moment, choose **Review → Refresh
expired highlights**.

## Putting your changes on the website

Edits in the spreadsheet do not appear on the website by themselves.
When you're done with a batch of changes, choose **Review → Publish
site**. A small message confirms the update has started; the website
rebuilds itself within a couple of minutes. One publish at the end of a
work session is all you need, no matter how many classes you touched.

## What makes a class appear on the website

A class shows on the site only when its **approved** cell in the
Offerings tab says **yes**. New submissions arrive without approval, so
nothing goes public until someone has reviewed it, typed "yes" in that
cell (you can do this in the edit window too), and published.

## House rules

**Please don't rename the tabs or the column headings — the website and
the editing tools find things by those names.**

 And once more for luck: nothing ever needs to be typed into **Form Responses 1**.

Questions or something behaving oddly? Contact the webmaster.
