<template>
  <q-layout view="lHh Lpr fff" class="bg-grey-1">
    <q-header  class="bg-primary " height-hint="64" >
      <q-toolbar class="GPL__toolbar" style="height: 64px">
        <q-icon name="fiber_smart_record" size="sm"/>

        <q-toolbar-title v-if="$q.screen.gt.sm" shrink class="row items-center no-wrap">
          <span class="q-ml-sm">PlasmIdo</span>
        </q-toolbar-title>

        <q-space />
        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn round flat>
            <q-avatar size="32px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
            <q-tooltip>Account</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="GPL__page-container">
      <router-view />

      <q-page-sticky expand position="left"  >
        <div class="fit q-pt-xl q-px-sm column bg-primary" :class="`shadow-12`">
          <q-btn round color="white" flat stack no-caps size="26px" class="GPL__side-btn" :to="{name: 'empty_workbook_path', params: {}}">
            <q-icon size="22px" name="library_books" />
            <div class="GPL__side-btn__label">Workbooks</div>
          </q-btn>

          <q-btn round flat color="white" stack no-caps size="26px" class="GPL__side-btn" :to="{name: 'empty_broker_path', params: {}}">
            <q-icon size="22px" name="collections_bookmark" />
            <div class="GPL__side-btn__label">Clusters</div>
          </q-btn>

          <q-btn round flat color="white" stack no-caps size="26px" class="GPL__side-btn" :to="{name: 'empty_registry_path', params: {}}">
            <q-icon size="22px" name="schema" />
            <div class="GPL__side-btn__label">Schemas</div>
          </q-btn>

          <q-btn round flat color="white" stack no-caps size="26px" class="GPL__side-btn" :to="{name: 'empty_environment_path', params: {}}">
            <q-icon size="22px" name="spellcheck" />
            <div class="GPL__side-btn__label">Environments</div>
          </q-btn>

          <q-btn round flat color="white" stack no-caps size="26px" class="GPL__side-btn">
            <q-icon size="22px" name="group" />
            <div class="GPL__side-btn__label">Settings</div>
<!--            <q-badge floating color="red" text-color="white" style="top: 8px; right: 16px">-->
<!--              1-->
<!--            </q-badge>-->
          </q-btn>

        </div>
      </q-page-sticky>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'MainLayout',

  data () {
    return {
      leftDrawerOpen: false,
      search: '',
      storage: 0.26,
      createMenu: [
        { icon: 'photo_album', text: 'Album' },
        { icon: 'people', text: 'Shared Album' },
        { icon: 'movie', text: 'Movie' },
        { icon: 'library_books', text: 'Animation' },
        { icon: 'dashboard', text: 'Collage' },
        { icon: 'book', text: 'Photo book' }
      ]
    }
  }
}
</script>

<style lang="sass">
.GPL

  &__toolbar
    height: 64px

  &__toolbar-input
    width: 35%

  &__drawer-item
    line-height: 24px
    border-radius: 0 24px 24px 0
    margin-right: 12px

    .q-item__section--avatar
      padding-left: 12px
      .q-icon
        color: #5f6368

    .q-item__label:not(.q-item__label--caption)
      color: #3c4043
      letter-spacing: .01785714em
      font-size: .875rem
      font-weight: 500
      line-height: 1.25rem

    &--storage
      border-radius: 0
      margin-right: 0
      padding-top: 24px
      padding-bottom: 24px

  &__side-btn
    &__label
      font-size: 12px
      line-height: 24px
      letter-spacing: .01785714em
      font-weight: 500

  @media (min-width: 1024px)
    &__page-container
      padding-left: 94px
</style>
