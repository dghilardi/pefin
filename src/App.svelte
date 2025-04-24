<script lang="ts">
  import { Alert } from "flowbite-svelte";
  import { onMount } from 'svelte';
  import { decodeJwtResponse, onGoogleScriptLoad } from './lib/utils/google';

  onMount(() => {
    onGoogleScriptLoad(decodeJwtResponse);
  });

  const handleSignin = () => {

  };

  const handleFailure = (event: CustomEvent) => {
    const err = event.detail;
    console.error(`Error while signing in: `, err);
  };
</script>

<svelte:head>
  <meta
    name="google-signin-client_id"
    content={import.meta.env.VITE_GOOGLE_CLIENT_ID}
  />
</svelte:head>

<div class="p-8">
  <button onclick={handleSignin}> Sign in with Google </button>
  <div id="googleSignIn"></div>
  <Alert>
    <span class="font-medium">Info alert!</span>
    Change a few things up and try submitting again.
  </Alert>
</div>
