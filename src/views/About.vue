<template>
  <div class="about">
    <div class="about-content">
      <h1>About AppReader</h1>
      <p class="lead">
        AppReader is a modern web application designed to help you manage your
        personal reading collection, track your reading progress, and discover
        new books.
      </p>

      <div class="about-sections">
        <section class="about-section">
          <h2>Our Mission</h2>
          <p>
            We believe that reading is one of the most enriching activities a
            person can engage in. Our goal is to make it easier for you to
            organize, track, and enjoy your reading journey.
          </p>
        </section>

        <section class="about-section">
          <h2>Features</h2>
          <ul>
            <li>Personal library management</li>
            <li>Reading progress tracking</li>
            <li>Notes and highlights</li>
            <li>Book discovery and recommendations</li>
            <li>Reading statistics and insights</li>
          </ul>
        </section>

        <section class="about-section">
          <h2>Technology</h2>
          <p>
            Built with modern web technologies including Vue.js 3, TypeScript,
            and Vite for a fast, responsive, and maintainable user experience.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// About page component
</script>

<style scoped>
.about {
  max-width: 800px;
  margin: 0 auto;
}

.about-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.about h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2.5rem;
}

.lead {
  font-size: 1.25rem;
  color: #7f8c8d;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.about-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.about-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.about-section p {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.about-section ul {
  color: #555;
  line-height: 1.6;
  padding-left: 1.5rem;
}

.about-section li {
  margin-bottom: 0.5rem;
}
</style>
