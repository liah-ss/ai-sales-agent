<script setup lang="ts">
import { useI18n } from '../../../composables/useI18n'
import { localizePath } from '../../../utils/localeRouting'

const { locale } = useI18n()

await navigateTo(localizePath('/solutions/ev-charging-station', locale.value), {
  redirectCode: 301,
  replace: true,
})
</script>
