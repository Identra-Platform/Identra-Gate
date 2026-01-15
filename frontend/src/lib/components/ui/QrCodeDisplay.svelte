<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  
  export let data: string;
  export let size = 256;
  export let margin = 1;
  export let showDownload = true;
  export let showCopy = true;
  export let canViewData = false;
  
  let canvas: HTMLCanvasElement;
  let qrCodeDataUrl: string = '';
  let error = '';
  
  onMount(async () => {
    await generateQRCode();
  });
  
  onDestroy(() => {
    if (qrCodeDataUrl) {
      URL.revokeObjectURL(qrCodeDataUrl);
    }
  });
  
  async function generateQRCode() {
    if (!data || !canvas) return;
    
    try {
      // Generate QR code to canvas
      await QRCode.toCanvas(canvas, data, {
        width: size,
        margin: margin,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Generate data URL for download
      qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: size,
        margin: margin
      });
      
      error = '';
    } catch (err) {
      error = 'Failed to generate QR code';
      console.error('QR code generation error:', err);
    }
  }
  
  function downloadQRCode() {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `verification-qr-${Date.now()}.png`;
    link.click();
  }
  
  function copyQRCodeData() {
    navigator.clipboard.writeText(data).then(() => {
      // Show success toast (you could add a toast system here)
      console.log('QR code data copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
</script>

<div class="flex flex-col items-center space-y-4">
  <!-- QR Code Canvas -->
  <div class="relative">
    <canvas
      bind:this={canvas}
      width={size}
      height={size}
      class="rounded-lg border border-outline-variant bg-white p-4"
    ></canvas>
    
    <!-- Error State -->
    {#if error}
      <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-error-container/90">
        <div class="text-center">
          <svg class="mx-auto h-8 w-8 text-on-error-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p class="mt-2 text-sm text-on-error-container">{error}</p>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Actions -->
  <div class="flex gap-2">
    {#if showDownload && qrCodeDataUrl && !error}
      <button
        on:click={downloadQRCode}
        class="flex items-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-sm font-medium text-on-primary-container hover:bg-primary-container/90"
        title="Download QR Code"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </button>
    {/if}
    
    {#if showCopy && data && !error}
      <button
        on:click={copyQRCodeData}
        class="flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container"
        title="Copy QR Data"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Data
      </button>
    {/if}
  </div>
  
  <!-- Data Preview -->
  {#if data && data.length > 100 && canViewData}
    <div class="w-full">
      <details class="w-full">
        <summary class="cursor-pointer text-sm font-medium text-on-surface-variant hover:text-primary">
          Show QR Code Data
        </summary>
        <div class="mt-2 rounded-lg bg-surface-container-high p-3">
          <pre class="overflow-x-auto text-xs font-mono text-on-surface break-all">
{data}
          </pre>
        </div>
      </details>
    </div>
  {/if}
</div>

<style>
  details > summary {
    list-style: none;
  }
  
  details > summary::-webkit-details-marker {
    display: none;
  }
  
  details > summary::after {
    content: '▼';
    float: right;
    transition: transform 0.2s;
  }
  
  details[open] > summary::after {
    transform: rotate(180deg);
  }
</style>