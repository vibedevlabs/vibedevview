# Zo Bootstrap Prompt

> Paste this into Zo chat after inserting your .zo config from Claude.

---

```
I have a complete agent configuration below. Please set up my Zo
by creating each piece:

1. Update my Bio with the BIO section
2. Create each Rule from the RULES section
3. Create the Persona from the PERSONA section
4. Create each Skill as a SKILL.md file in /home/workspace/Skills/
5. Create each Automation from the AUTOMATIONS section
6. Create the file/folder structure from the FILE STRUCTURE section

After creating everything, give me a summary of what you built:
- How many rules created
- Which persona is active
- Which skills are installed
- Which automations are scheduled (with their next run time)
- What folders were created

Here's the configuration:

[PASTE YOUR .ZO CONFIG HERE]
```

## Verification Prompt

After bootstrapping, run this to verify everything:

```
Give me a full status report:
1. Show me my current Bio
2. List all my rules (always-on and conditional)
3. List my personas and which is active
4. List my skills (name + description)
5. List my automations (name + schedule + delivery)
6. Show the file tree at /home/workspace/
```

## Export Prompt

When ready to export to GitHub:

```
Export my complete agent configuration to a Git-ready repository
structure at /home/workspace/zo-export/. Create these files:

1. README.md — overview of the agent system
2. zo/install/bio.md — my current Bio
3. zo/install/rules.md — all my Rules (formatted with slugs)
4. zo/install/persona.md — my active Persona prompt
5. zo/install/automations.md — all my Automations
6. zo/Skills/ — copy all my SKILL.md files and folders
7. zo/state/ — create an empty directory

After creating everything, show me the file tree.
```
