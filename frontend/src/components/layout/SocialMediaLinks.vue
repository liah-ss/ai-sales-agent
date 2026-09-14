<script setup lang="ts">
defineProps<{
  facebookUrl: string
  linkedinUrl: string
  mobile?: boolean
}>()
</script>

<template>
  <div class="social-media-links" :class="{ mobile }" aria-label="Social media">
    <a
      v-if="facebookUrl"
      class="social-media-link facebook"
      :href="facebookUrl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Facebook"
      title="Facebook"
    >
      <span class="social-media-mark facebook-mark" aria-hidden="true">f</span>
      <span v-if="mobile" class="social-media-label">Facebook</span>
    </a>
    <a
      v-if="linkedinUrl"
      class="social-media-link linkedin"
      :href="linkedinUrl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LinkedIn"
      title="LinkedIn"
    >
      <span class="social-media-mark linkedin-mark" aria-hidden="true">in</span>
      <span v-if="mobile" class="social-media-label">LinkedIn</span>
    </a>
  </div>
</template>

<style scoped>
.social-media-links {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.social-media-link {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  background: #1b6d86;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.social-media-link:hover {
  filter: brightness(1.12);
  transform: translateY(-1px);
}

.social-media-link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.social-media-mark {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.facebook-mark {
  font-family: Helvetica, Arial, sans-serif;
}

.social-media-links.mobile {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mobile .social-media-link {
  width: 100%;
  height: 44px;
  border-radius: 4px;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
}

.social-media-label {
  letter-spacing: 0;
}
</style>
