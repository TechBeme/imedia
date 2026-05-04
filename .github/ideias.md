Quero criar nessa passo a passo, um código Next.js que será a minha ferramenta de mídia para gerenciar todas as minhas redes sociais. Esse site vai conter as mais diversas ferramentas possíveis. 

para isso. ele vai se integrar diretamente com a do hook da Meta. para poder obter informações sobre as minhas mídias sociais. Eu quero que ele tenha acesso ao meu Instagram, Threads, Facebook e tudo que tem a ver com a Meta. 

Vou também integrar ele com o YouTube. para ele ter acesso a todos os meus vídeos do YouTube, poder fazer o upload das legendas, título, descrição, entre outras informações. 

Ele também deverá integrar com o TikTok. para fazer a mesma coisa, integrar com todos os meus vídeos. comentários, directs. igual no Instagram. 

Também quero que ele integre ao X, antigo Twitter. 

Esse app deve ter todas as funcionalidades de upload, agendamento, entre outras coisas. Ou seja, mesmo que a plataforma não tenha suporte, eu quero ter possibilidade de agendar post se a plataforma tiver suporte, faça o agendamento direto na plataforma. Se não tiver, eu quero que você implemente uma funcionalidade para que ele execute o agendamento no horário que o usuário selecionou. 

Você deve consultar a API oficial de cada uma dessas ferramentas para poder conseguir desenvolver cada uma dessas funcionalidades. Não invente nada, não tente descobrir nada, investigue API oficial, busque todas as informações oficialmente da API. 

Vamos começar com essas integrações. Você vai fazer o planejamento completo de como criar esse site. Etapa por etapa.

O site precisa ter autenticação. Tendo em vista que eu preciso garantir a máxima segurança possível. que só eu realmente possa acessar as minhas informações. 

Vamos seguir com o banco de dados Postgres, que eu vou hospedar no Neon. Vamos subir todo esse código para o Vercel. Portanto, para eu criar a database, primeiro precisamos subir esse projeto inicial para o Vercel. Eu quero que você inicia aqui um repositório Git. Porém, eu não quero vincular esse repositório no Vercel. Quando fizer o upload para o Vercel, faço o upload sem vincular o repositório GitHub.

Você deve, no planejamento, criar o projeto completo, ou seja, tudo que deve ser feito para isso chegar ao nível de produção, com a máxima robustez possível, com teste de validação CI/CD, testes unitários, etc

Você deve gerenciar uma lista de tasks de tudo que deve ser feito para atingir o maior nível de robustez possível.

Você deve dividir as tasks em agrupamento de tasks, ou seja, você deve fazer primeiro o essencial, ou seja, as tasks iniciais são para colocar o app rodando imediatamente, ou Ou seja, independentemente de qualquer integração com qualquer provedor externo, você deve colocar primeiro as testes essenciais para o site surgir, ou seja, para os primeiros dashboards, para as primeiras coisas começarem a existir. Primeiro eu vou validar tudo, verificar se o front-end está de acordo com o que eu gosto, sem você implementar nada do back-end ainda. Vamos implementar primeiro apenas as interfaces, compreender o que que eu quero que apareça em cada uma dessas interfaces. para só depois começarmos a desenvolver o backend.

Quero que você também separe as integrações por agrupamentos, por exemplo, Instagram, Facebook, etc. Vamos começar por enquanto apenas com o Instagram. Eu não quero nenhuma das outras integrações as operações sendo implementadas agora, porém você deve criar todo o planejamento já para cada uma delas. Portanto, o Instagram deve ser a primeira na ordem da lista após o desenvolvimento do front-end. 

Cria agora o projeto. final do nosso app. 