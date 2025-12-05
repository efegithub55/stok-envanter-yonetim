function calculate() {
  const alis = parseFloat(
    document.querySelector("input[name='alis_fiyati']").value
  );
  const satis = parseFloat(
    document.querySelector("input[name='satis_fiyati']").value
  );
  const kdv = parseFloat(document.querySelector("input[name='kdv']").value);
  const mevcut_stok = parseFloat(
    document.querySelector("input[name='mevcut_stok']").value
  );

  const kar_marji = document.getElementById("kar_marji");
  const birim_kar = document.getElementById("birim_kar");
  const envanter_deger = document.getElementById("envanter_deger");

  if (isNaN(alis) || isNaN(satis) || isNaN(kdv) || isNaN(mevcut_stok)) return;

  const kdv_maliyeti = (satis * kdv) / 100;
  const kar = satis - alis - kdv_maliyeti;
  const marj = ((kar / alis) * 100).toFixed(2);

  kar_marji.textContent = `%${marj}`;
  birim_kar.textContent = `${(satis - alis).toFixed(2)}₺`;
  envanter_deger.textContent = `${(mevcut_stok * alis).toLocaleString()}₺`;
}

const calcInps = document.querySelectorAll(".calc-inp");
calcInps.forEach((input) => {
  input.addEventListener("input", () => {
    calculate();
  });
});
