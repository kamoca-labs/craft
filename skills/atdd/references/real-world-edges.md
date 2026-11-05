# Real-world edges

Code that works only with perfect data breaks in the hands of the user. In step 1 of `craft:atdd`, compare each edge in this list with the feature:

| Edge | Example |
|---|---|
| Empty text and very long text | empty name, description with 5,000 characters |
| Emoji and accent | `Zoë 🚀` in the name field |
| Large number | value in the billions |
| Very large list | 10,000 items in the listing |
| Network drops or times out | the API does not answer in 30 s |
| Response 401, 403, 404 and 500 | expired session, item already deleted, server error |
| No permission | user without the editor role opens the edit screen |
| Double submit | two quick clicks on the save button |
| Concurrent operation | two people edit the same item |

- Write one scenario for each edge that the feature has.
- An edge that the feature does not have does not become a scenario. Example: a rule with no network has no timeout edge.
- The edge scenario follows the loop like the others: one per turn.

The unit-tests reference of `craft:craft` uses this same list to find the equivalence classes.
