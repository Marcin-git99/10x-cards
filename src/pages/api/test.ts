import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('POST /api/test - Otrzymano żądanie');
    
    // Zwracamy zawsze poprawną odpowiedź bez parsowania JSON
    // Testowe rozwiązanie omijające problem z parsowaniem JSON
      
    return new Response(
      JSON.stringify({
        success: true,
        message: "Test endpoint działa poprawnie. Pomijamy parsowanie JSON."
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Ogólny błąd:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Wystąpił błąd podczas przetwarzania żądania',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
