UPDATE questions AS question
SET type = 'MULTIPLE_CHOICE', updated_at = NOW()
FROM skills AS skill
WHERE skill.id = question.skill_id
  AND skill.name = 'JavaScript'
  AND question.text = 'What is the difference between let, const, and var?';
