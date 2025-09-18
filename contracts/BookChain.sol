// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title BookChain - Gestione decentralizzata di club del libro
/// @notice Questo contratto consente di creare club del libro, proporre titoli,
/// votare le proposte e creare post di discussione all'interno dei club.
/// @dev Usa strutture semplici in memoria/archiviazione e array dinamici; nessun meccanismo
/// di controllo dei permessi oltre ai controlli di appartenenza e del creatore del club.
contract BookChain {
    /// @notice Modello dati per un club del libro
    struct Club {
        uint256 id;
        string name;
        string description;
        address creator;
        address[] members;
        string currentBook;
        string currentAuthor;
        BookProposal[] currentProposals;
        Post[] posts;
        mapping(address => bool) hasVoted;
    }
    
    /// @notice Modello dati per un libro letto dal club
    struct Book {
        string title;
        string author;
        uint256 readDate;
        Post[] posts;
    }
    
    /// @notice Proposta di libro da votare nel club
    struct BookProposal {
        string title;
        string author;
        address proposer;
        uint256 votes;
        bool isActive;
    }
    
    /// @notice Post di discussione associato a un club o a un libro
    struct Post {
        string title;
        string content;
        address author;
        uint256 timestamp;
    }
    
    Club[] public clubs;
    uint256 public nextClubId = 1;
    
    /// @notice Emesso quando viene creato un nuovo club
    event ClubCreated(uint256 indexed clubId, string name, address creator);
    /// @notice Emesso quando un utente entra a far parte di un club
    event MemberJoined(uint256 indexed clubId, address member);
    /// @notice Emesso quando viene proposta la lettura di un libro
    event BookProposed(uint256 indexed clubId, string title, string author);
    /// @notice Emesso quando viene registrato un voto per una proposta
    event BookVoted(uint256 indexed clubId, string title, uint256 votes);
    /// @notice Emesso quando viene creato un nuovo post nel club
    event PostCreated(uint256 indexed clubId, string title, address author);
    /// @notice Emesso quando la votazione viene finalizzata e viene scelto il libro vincitore
    event VotingFinalized(uint256 clubId, string title, string author);
    
    /// @notice Crea un nuovo club del libro
    /// @param _name Nome del club
    /// @param _description Descrizione del club
    /// @return L'identificativo univoco del club creato
    function createClub(string memory _name, string memory _description) external returns (uint256) {
        uint256 clubId = nextClubId++;
        
        // Aggiunge un nuovo club all'array dei club
        clubs.push();
        
        // Accede all'ultimo elemento aggiunto per inizializzarlo
        Club storage newClub = clubs[clubs.length - 1];
        newClub.id = clubId;
        newClub.name = _name;
        newClub.description = _description;
        newClub.creator = msg.sender;
        newClub.members.push(msg.sender);
        
        emit ClubCreated(clubId, _name, msg.sender);
        return clubId;
    }
    
    /// @notice Entra a far parte di un club esistente
    /// @param _clubId Identificativo del club
    function joinClub(uint256 _clubId) external {
        require(_clubId < clubs.length, "Club does not exist");
        Club storage club = clubs[_clubId];
        
        // Verifica se l'utente è già membro del club
        for (uint i = 0; i < club.members.length; i++) {
            if (club.members[i] == msg.sender) {
                revert("Already a member");
            }
        }
        
        club.members.push(msg.sender);
        emit MemberJoined(_clubId, msg.sender);
    }
    
    /// @notice Propone un nuovo libro da leggere nel club
    /// @dev Solo i membri del club possono proporre libri
    /// @param _clubId Identificativo del club
    /// @param _title Titolo del libro proposto
    /// @param _author Autore del libro proposto
    function proposeBook(uint256 _clubId, string memory _title, string memory _author) external {
        require(_clubId < clubs.length, "Club does not exist");
        Club storage club = clubs[_clubId];
        
        // Verifica se il chiamante è un membro del club
        bool isMember = false;
        for (uint i = 0; i < club.members.length; i++) {
            if (club.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a member of this club");
        
        BookProposal memory newProposal = BookProposal({
            title: _title,
            author: _author,
            proposer: msg.sender,
            votes: 0,
            isActive: true
        });
        
        club.currentProposals.push(newProposal);
        emit BookProposed(_clubId, _title, _author);
    }
    
    /// @notice Vota una proposta di libro del club
    /// @dev Un membro può votare una sola volta per round di votazione
    /// @param _clubId Identificativo del club
    /// @param _proposalIndex Indice della proposta nell'array delle proposte correnti
    function voteForBook(uint256 _clubId, uint256 _proposalIndex) external {
        require(_clubId < clubs.length, "Club does not exist");
        Club storage club = clubs[_clubId];
        require(_proposalIndex < club.currentProposals.length, "Invalid proposal");
        require(!club.hasVoted[msg.sender], "Already voted");
        
        // Verifica se il chiamante è un membro del club
        bool isMember = false;
        for (uint i = 0; i < club.members.length; i++) {
            if (club.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a member of this club");
        
        club.currentProposals[_proposalIndex].votes++;
        club.hasVoted[msg.sender] = true;
        
        emit BookVoted(_clubId, club.currentProposals[_proposalIndex].title, club.currentProposals[_proposalIndex].votes);
    }

    /// @notice Finalizza la votazione del club scegliendo la proposta vincente
    /// @dev Solo il creatore del club può finalizzare; disattiva tutte le proposte e
    /// reimposta lo stato di voto dei membri per il prossimo round
    /// @param clubId Identificativo del club
    function finalizeVoting(uint256 clubId) external {
        require(clubId < clubs.length, "Club does not exist");
        Club storage club = clubs[clubId];

        require(msg.sender == club.creator, "Solo il creatore puo' finalizzare");
        require(club.currentProposals.length > 0, "Nessuna proposta disponibile");

        uint256 winningIndex = 0;
        uint256 highestVotes = 0;

        for (uint256 i = 0; i < club.currentProposals.length; i++) {
            BookProposal storage p = club.currentProposals[i];
            if (p.isActive && p.votes > highestVotes) {
                highestVotes = p.votes;
                winningIndex = i;
            }
            p.isActive = false;
        }

        BookProposal storage winner = club.currentProposals[winningIndex];

        // Aggiorna il libro corrente con il vincitore
        club.currentBook = winner.title;
        club.currentAuthor = winner.author;

        // Reimposta i voti e svuota le proposte per il prossimo round
        for (uint256 i = 0; i < club.members.length; i++) {
            club.hasVoted[club.members[i]] = false;
        }
        delete club.currentProposals;

        emit VotingFinalized(clubId, winner.title, winner.author);
    }

    
    /// @notice Crea un post nel club
    /// @dev Solo i membri del club possono creare post
    /// @param _clubId Identificativo del club
    /// @param _title Titolo del post
    /// @param _content Contenuto del post
    function createPost(uint256 _clubId, string memory _title, string memory _content) external {
        require(_clubId < clubs.length, "Club does not exist");
        Club storage club = clubs[_clubId];
        
        // Verifica se il chiamante è un membro del club
        bool isMember = false;
        for (uint i = 0; i < club.members.length; i++) {
            if (club.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a member of this club");
        
        Post memory newPost = Post({
            title: _title,
            content: _content,
            author: msg.sender,
            timestamp: block.timestamp
        });
        
        // Aggiunge il post direttamente all'elenco dei post del club
        club.posts.push(newPost);
        
        emit PostCreated(_clubId, _title, msg.sender);
    }
    
    /// @notice Restituisce le informazioni principali di un club
    /// @param _clubId Identificativo del club
    /// @return id Identificativo del club
    /// @return name Nome del club
    /// @return description Descrizione del club
    /// @return creator Indirizzo del creatore del club
    /// @return memberCount Numero di membri del club
    /// @return currentBook Titolo del libro corrente
    /// @return currentAuthor Autore del libro corrente
    function getClub(uint256 _clubId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        address creator,
        uint256 memberCount,
        string memory currentBook,
        string memory currentAuthor
    ) {
        require(_clubId < clubs.length, "Club does not exist");
        Club storage club = clubs[_clubId];
        return (
            club.id,
            club.name,
            club.description,
            club.creator,
            club.members.length,
            club.currentBook,
            club.currentAuthor
        );
    }
    
    /// @notice Restituisce gli indirizzi dei membri di un club
    /// @param _clubId Identificativo del club
    /// @return Array di indirizzi dei membri
    function getClubMembers(uint256 _clubId) external view returns (address[] memory) {
        require(_clubId < clubs.length, "Club does not exist");
        return clubs[_clubId].members;
    }
    
    /// @notice Restituisce le proposte di libro correnti di un club
    /// @param _clubId Identificativo del club
    /// @return Array di proposte correnti
    function getClubProposals(uint256 _clubId) external view returns (BookProposal[] memory) {
        require(_clubId < clubs.length, "Club does not exist");
        return clubs[_clubId].currentProposals;
    }
    
    /// @notice Restituisce i post del club
    /// @param _clubId Identificativo del club
    /// @return Array di post associati al club
    function getClubPosts(uint256 _clubId) external view returns (Post[] memory) {
        require(_clubId < clubs.length, "Club does not exist");
        return clubs[_clubId].posts;
    }
    
    /// @notice Restituisce gli ID dei club a cui appartiene un utente
    /// @param user Indirizzo dell'utente
    /// @return Elenco degli ID di club a cui l'utente partecipa
    function getUserClubs(address user) external view returns (uint256[] memory) {
        uint256[] memory userClubIds = new uint256[](clubs.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < clubs.length; i++) {
            Club storage club = clubs[i];
            for (uint256 j = 0; j < club.members.length; j++) {
                if (club.members[j] == user) {
                    userClubIds[count] = i;
                    count++;
                    break;
                }
            }
        }
        
        // Ridimensiona l'array alla dimensione effettiva
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userClubIds[i];  // Copia degli ID raccolti
        }
        
        return result;
    }
}