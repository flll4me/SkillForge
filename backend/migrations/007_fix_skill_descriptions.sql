UPDATE skills
SET description = CASE name
  WHEN 'JavaScript' THEN 'Programming language used to build interactive web applications.'
  WHEN 'TypeScript' THEN 'JavaScript with static type checking and richer tooling.'
  WHEN 'React' THEN 'Library for building component-based user interfaces.'
  WHEN 'Node.js' THEN 'JavaScript runtime for server-side and command-line applications.'
  WHEN 'HTML' THEN 'Markup language used to structure web pages.'
  WHEN 'CSS' THEN 'Style sheet language used to present web pages.'
  WHEN 'SQL' THEN 'Language for querying and managing relational data.'
  WHEN 'Git' THEN 'Distributed version control system for tracking code changes.'
  ELSE description
END
WHERE name IN ('JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git');
