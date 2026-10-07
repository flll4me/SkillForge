const welcome = document.querySelector('.welcome');
const initialWelcomeMarkup = welcome.innerHTML;

const questionSets = {
  Frontend: [
    { topic: 'JavaScript', prompt: 'В чём разница между let, const и var?' },
    { topic: 'Асинхронность', prompt: 'Как работает event loop и чем Promise отличается от setTimeout?' },
    { topic: 'React', prompt: 'Зачем React нужны ключи (key) при выводе списков?' },
  ],
  Backend: [
    { topic: 'HTTP и API', prompt: 'Чем отличаются методы GET, POST, PUT и PATCH?' },
    { topic: 'Базы данных', prompt: 'Что такое индекс в базе данных и в каких случаях он полезен?' },
    { topic: 'Авторизация', prompt: 'Чем аутентификация отличается от авторизации?' },
  ],
  Fullstack: [
    { topic: 'Клиент и сервер', prompt: 'Что происходит между отправкой формы в браузере и получением ответа от сервера?' },
    { topic: 'REST API', prompt: 'Как бы ты спроектировал API для списка задач: получение, создание и изменение?' },
    { topic: 'Архитектура', prompt: 'Как разделить ответственность между frontend, backend и базой данных?' },
  ],
};

let interview = null;

welcome.addEventListener('submit', (event) => {
  if (event.target.id === 'interview-setup') {
    event.preventDefault();
    const formData = new FormData(event.target);
    const track = formData.get('track');

    interview = {
      track,
      level: formData.get('level'),
      questions: questionSets[track],
      answers: questionSets[track].map(() => ''),
      currentIndex: 0,
    };

    renderQuestion();
    return;
  }

  if (event.target.id !== 'interview-answer-form') return;

  event.preventDefault();
  const answer = new FormData(event.target).get('answer').trim();
  if (!answer) return;

  interview.answers[interview.currentIndex] = answer;

  if (interview.currentIndex === interview.questions.length - 1) {
    renderResults();
    return;
  }

  interview.currentIndex += 1;
  renderQuestion();
});

welcome.addEventListener('input', (event) => {
  if (event.target.name === 'answer' && interview) {
    interview.answers[interview.currentIndex] = event.target.value;
  }
});

welcome.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'previous' && interview.currentIndex > 0) {
    interview.currentIndex -= 1;
    renderQuestion();
  }

  if (action === 'home') {
    interview = null;
    welcome.innerHTML = initialWelcomeMarkup;
  }
});

function renderQuestion() {
  const question = interview.questions[interview.currentIndex];
  const questionNumber = interview.currentIndex + 1;

  welcome.innerHTML = `
    <section class="interview" aria-labelledby="interview-title">
      <button class="interview__back" type="button" data-action="home">← К направлениям</button>
      <div class="interview__header">
        <p class="interview__eyebrow">${interview.track} · ${interview.level}</p>
        <p class="interview__counter">Вопрос ${questionNumber} из ${interview.questions.length}</p>
      </div>
      <progress class="interview__progress" value="${questionNumber}" max="${interview.questions.length}" aria-label="Прогресс интервью"></progress>
      <form class="interview__form" id="interview-answer-form">
        <p class="interview__topic">${question.topic}</p>
        <h1 class="interview__title" id="interview-title">${question.prompt}</h1>
        <label class="interview__label" for="answer">Твой ответ</label>
        <textarea class="interview__answer" id="answer" name="answer" rows="7" placeholder="Напиши ответ своими словами…" required>${escapeHtml(interview.answers[interview.currentIndex])}</textarea>
        <div class="interview__actions">
          <button class="interview__previous" type="button" data-action="previous" ${interview.currentIndex === 0 ? 'disabled' : ''}>Назад</button>
          <button class="interview__next" type="submit">${questionNumber === interview.questions.length ? 'Завершить интервью' : 'Следующий вопрос'} <span aria-hidden="true">→</span></button>
        </div>
      </form>
    </section>`;

  welcome.querySelector('.interview__answer').focus();
}

function renderResults() {
  welcome.innerHTML = `
    <section class="interview-result" aria-labelledby="result-title">
      <p class="interview-result__eyebrow">${interview.track} · ${interview.level}</p>
      <h1 class="interview-result__title" id="result-title">Интервью завершено</h1>
      <p class="interview-result__lead">Ты ответил на ${interview.questions.length} вопроса. Посмотри на свои ответы и отметь темы, которые стоит повторить.</p>
      <div class="interview-result__answers" id="result-answers"></div>
      <button class="interview-result__home" type="button" data-action="home">Вернуться к направлениям</button>
    </section>`;

  const answersContainer = welcome.querySelector('#result-answers');

  interview.questions.forEach((question, index) => {
    const answerCard = document.createElement('article');
    answerCard.className = 'answer-card';

    const topic = document.createElement('p');
    topic.className = 'answer-card__topic';
    topic.textContent = question.topic;

    const prompt = document.createElement('h2');
    prompt.className = 'answer-card__question';
    prompt.textContent = question.prompt;

    const answer = document.createElement('p');
    answer.className = 'answer-card__text';
    answer.textContent = interview.answers[index];

    answerCard.append(topic, prompt, answer);
    answersContainer.append(answerCard);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}
