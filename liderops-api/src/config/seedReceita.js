// Carga inicial da tabela empresas_receita_bruta para o garimpo funcionar sem o CSV completo da Receita.
// Todos os CNPJs abaixo foram conferidos na Brasil API em 31/10/2026: situação ATIVA, porte 05 (Demais),
// capital social >= R$ 500 mil e município dentro do ICP (SP inteiro, Sul de MG, Grande Vitória/ES e Anápolis/GO).

const EMPRESAS_SEED = [
    // SP
    { cnpj: '07526557000100', razao_social: 'AMBEV S.A.', nome_fantasia: null, cnae: '1113502', uf: 'SP', municipio: 'SAO PAULO', capital: 58308215000.00, telefone: '1933135680' },
    { cnpj: '71673990000177', razao_social: 'NATURA COSMETICOS S/A', nome_fantasia: 'NATURA', cnae: '4646001', uf: 'SP', municipio: 'SAO PAULO', capital: 6000000000.00, telefone: '1143897317' },
    { cnpj: '61079117000105', razao_social: 'ALPARGATAS S.A.', nome_fantasia: null, cnae: '1311100', uf: 'SP', municipio: 'SAO PAULO', capital: 3088257300.00, telefone: '1138477322' },
    { cnpj: '02916265000160', razao_social: 'JBS S/A', nome_fantasia: null, cnae: '1011201', uf: 'SP', municipio: 'SAO PAULO', capital: 23631071000.00, telefone: '1131444000' },
    { cnpj: '61190096000192', razao_social: 'EUROFARMA LABORATORIOS S.A.', nome_fantasia: 'EUROFARMA - MOMENTA', cnae: '7490199', uf: 'SP', municipio: 'SAO PAULO', capital: 1462000000.00, telefone: '1150908612' },
    { cnpj: '60409075000152', razao_social: 'NESTLE BRASIL LTDA.', nome_fantasia: null, cnae: '1099699', uf: 'SP', municipio: 'SAO PAULO', capital: 11758892000.00, telefone: '1155084400' },
    { cnpj: '61068276000104', razao_social: 'UNILEVER BRASIL LTDA.', nome_fantasia: null, cnae: '4646002', uf: 'SP', municipio: 'SAO PAULO', capital: 764914200.00, telefone: '1137037675' },
    { cnpj: '43461789000190', razao_social: 'QUIMICA AMPARO LTDA', nome_fantasia: null, cnae: '2061400', uf: 'SP', municipio: 'AMPARO', capital: 946414700.00, telefone: '1938088177' },
    { cnpj: '61186888000193', razao_social: 'SPAL INDUSTRIA BRASILEIRA DE BEBIDAS S/A', nome_fantasia: 'SPAL', cnae: '4635402', uf: 'SP', municipio: 'SAO PAULO', capital: 2719959800.00, telefone: '1121025500' },
    { cnpj: '50221019000136', razao_social: 'HNK BR INDUSTRIA DE BEBIDAS LTDA.', nome_fantasia: null, cnae: '1113502', uf: 'SP', municipio: 'ITU', capital: 6017633000.00, telefone: '1121189500' },
    { cnpj: '97837181000147', razao_social: 'DEXCO S.A', nome_fantasia: null, cnae: '1621800', uf: 'SP', municipio: 'SAO PAULO', capital: 4370189000.00, telefone: '1131797283' },
    { cnpj: '47960950000121', razao_social: 'MAGAZINE LUIZA S/A', nome_fantasia: 'MAGAZINE LUIZA', cnae: '4713004', uf: 'SP', municipio: 'FRANCA', capital: 14202162000.00, telefone: '1637112002' },
    { cnpj: '56998701000116', razao_social: 'ABBOTT LABORATORIOS DO BRASIL LTDA', nome_fantasia: null, cnae: '2121101', uf: 'SP', municipio: 'SAO PAULO', capital: 1502475500.00, telefone: '1155367042' },
    { cnpj: '02932074000191', razao_social: 'HYPERA S.A.', nome_fantasia: 'HYPERA PHARMA', cnae: '4644301', uf: 'SP', municipio: 'SAO PAULO', capital: 11205886000.00, telefone: '6238788150' },
    { cnpj: '60659463000191', razao_social: 'ACHE LABORATORIOS FARMACEUTICOS SA', nome_fantasia: null, cnae: '2121101', uf: 'SP', municipio: 'GUARULHOS', capital: 1296672300.00, telefone: '1126086294' },
    { cnpj: '44734671000151', razao_social: 'CRISTALIA PRODUTOS QUIMICOS FARMACEUTICOS LTDA', nome_fantasia: 'LABORATORIO CRISTALIA', cnae: '2121101', uf: 'SP', municipio: 'ITAPIRA', capital: 900000000.00, telefone: '1938639500' },
    { cnpj: '64904295000103', razao_social: 'CAMIL ALIMENTOS S.A.', nome_fantasia: null, cnae: '1061901', uf: 'SP', municipio: 'SAO PAULO', capital: 2342483500.00, telefone: '1130399200' },
    { cnpj: '13324184000197', razao_social: 'VIGOR ALIMENTOS S.A', nome_fantasia: null, cnae: '4631100', uf: 'SP', municipio: 'SAO PAULO', capital: 4611315000.00, telefone: '1127995763' },
    { cnpj: '23643315000152', razao_social: 'DANONE LTDA', nome_fantasia: null, cnae: '1052000', uf: 'SP', municipio: 'SAO PAULO', capital: 851128000.00, telefone: '3537297901' },
    { cnpj: '60498706000157', razao_social: 'CARGILL AGRICOLA S A', nome_fantasia: null, cnae: '1042200', uf: 'SP', municipio: 'SAO PAULO', capital: 8179542500.00, telefone: '1150993311' },
    { cnpj: '02814497000107', razao_social: 'CIMED INDUSTRIA S.A.', nome_fantasia: null, cnae: '2121101', uf: 'SP', municipio: 'SAO PAULO', capital: 56186390.00, telefone: '1135447200' },

    // MG (Sul de Minas)
    { cnpj: '23637697000101', razao_social: 'ALCOA ALUMINIO S/A', nome_fantasia: null, cnae: '2441501', uf: 'MG', municipio: 'POCOS DE CALDAS', capital: 5478070000.00, telefone: '3537295484' },

    // ES (Grande Vitória)
    { cnpj: '28053619000183', razao_social: 'CHOCOLATES GAROTO LTDA.', nome_fantasia: null, cnae: '1093701', uf: 'ES', municipio: 'VILA VELHA', capital: 575615940.00, telefone: '1155084400' },

    // GO (Anápolis)
    { cnpj: '17159229000176', razao_social: 'LABORATORIO TEUTO BRASILEIRO S/A', nome_fantasia: null, cnae: '2121101', uf: 'GO', municipio: 'ANAPOLIS', capital: 661946700.00, telefone: '6233102000' },
    { cnpj: '05161069000110', razao_social: 'BRAINFARMA INDUSTRIA QUIMICA E FARMACEUTICA S.A.', nome_fantasia: 'NEO QUIMICA', cnae: '2121101', uf: 'GO', municipio: 'ANAPOLIS', capital: 5059101700.00, telefone: '6238788150' },
    { cnpj: '30222814000131', razao_social: 'VITAMEDIC INDUSTRIA FARMACEUTICA LTDA', nome_fantasia: null, cnae: '2121101', uf: 'GO', municipio: 'ANAPOLIS', capital: 995417800.00, telefone: '6239026100' }
];

// Converte para o formato de linha esperado por Empresa.inserirLoteBruto
function linhasSeedReceita() {
    return EMPRESAS_SEED.map(e => [
        e.cnpj, e.razao_social, e.nome_fantasia, e.cnae, e.uf, e.municipio, '05', e.capital, e.telefone, null
    ]);
}

module.exports = { EMPRESAS_SEED, linhasSeedReceita };
