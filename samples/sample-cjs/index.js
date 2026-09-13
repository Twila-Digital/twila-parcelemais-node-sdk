const { ParceleMaisClient, ParceleMaisEnvironment, ParceleMaisApiError } = require('@twila/parcelemais');

async function main() {
  const clientId = process.env.PARCELEMAIS_CLIENT_ID;
  const clientSecret = process.env.PARCELEMAIS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Defina PARCELEMAIS_CLIENT_ID e PARCELEMAIS_CLIENT_SECRET no ambiente antes de rodar este sample.');
    process.exitCode = 1;
    return;
  }

  const client = new ParceleMaisClient({
    clientId,
    clientSecret,
    environment: ParceleMaisEnvironment.Staging,
  });

  try {
    const parcelas = await client.simulations.simulateInstallments({ requestedAmount: 1500.0 });

    for (const parcela of parcelas) {
      console.log(`${parcela.term}x de ${parcela.installmentAmount} (total ${parcela.totalAmount})`);
    }
  } catch (error) {
    if (error instanceof ParceleMaisApiError) {
      console.error(`${error.statusCode} ${error.errorCode}: ${error.message}`);
    } else {
      throw error;
    }
  }
}

main();
