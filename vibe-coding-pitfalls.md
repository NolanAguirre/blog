# Vibe coding pitfalls

Vibe coding tools will not remove old code! Even when you tell it to it will stuggle, it feels like a fight to get it to remove those 300 lines of dead code after the refactor you just did. Now the old pattern is still in the repo and will confuse the AI, meaning future refactors will need to many more places that you'd imagine.


Vibe coding tools SUCK as using common components and handling the extend vs one-off consideration. I've setup common components, told the model to use the common component, and it will still create a rather verbose wrapper or a one-off to add a single feature to a common component. "Oh, that form has 7 out of 8 things I need, well better reimplmenent those 7 things in a new component instead of extending the common component to support the 8th thing I need"

And now you refactor, and adds the 8th feature to the common component, BUT IT DOESNT REMOVE THE SINGLETON CODE! so when you add the 9th feature and assume all of your pages using the common component will get the feature, IT SHOWS UP ON ALL BUT THAT ONE PAGE AHHHHHHHHHHH.