<script setup lang="ts">
import NotFoundView from '../../views/NotFoundView.vue'

setResponseStatus(404)
useSeoMeta({ robots: 'noindex,nofollow', title: 'Page not found | ExampleCorp' })
</script>

<template><NotFoundView /></template>
