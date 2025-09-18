class BookChainApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
        this.currentClub = null;
        this.userAddress = null;
        this.metaMaskReady = false;
        
        this.initializeApp();
    }

    getReadOnlyContract() {
        try {
            const abi = [
                "function getClub(uint256 clubId) external view returns (uint256 id, string name, string description, address creator, uint256 memberCount, string currentBook, string currentAuthor)",
                "function nextClubId() external view returns (uint256)"
            ];
            const roProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            return new ethers.Contract(this.contractAddress, abi, roProvider);
        } catch {
            return null;
        }
    }

    async connectContract() {
        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            const contractABI = await this.getContractABI();
            this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);
            this.loadUserClubs();
            this.loadAllClubs();
        } catch (error) {}
    }
    
    async getContractABI() {
        return [
            "function createClub(string name, string description) external returns (uint256)",
            "function joinClub(uint256 clubId) external",
            "function proposeBook(uint256 clubId, string title, string author) external",
            "function voteForBook(uint256 clubId, uint256 proposalIndex) external",
            "function finalizeVoting(uint256 clubId) external",
            "function createPost(uint256 clubId, string title, string content) external",
            "function getClub(uint256 clubId) external view returns (uint256 id, string name, string description, address creator, uint256 memberCount, string currentBook, string currentAuthor)",
            "function getClubMembers(uint256 clubId) external view returns (address[] memory)",
            "function getClubProposals(uint256 clubId) external view returns (tuple(string title, string author, address proposer, uint256 votes, bool isActive)[] memory)",
            "function getClubPosts(uint256 clubId) external view returns (tuple(string title, string content, address author, uint256 timestamp)[] memory)",
            "function getUserClubs(address user) external view returns (uint256[] memory)",
            "function nextClubId() external view returns (uint256)"
        ];
    }   
    
    async initializeApp() {
        this.setupEventListeners();
        this.setupMetaMaskEventListeners();
        await this.checkHardhatNode();
        
        if (this.isMetaMaskAvailable()) {
            this.metaMaskReady = true;
            this.setupMetaMask();
        } else {
            this.waitForMetaMask();
        }
    }
    
    setupMetaMaskEventListeners() {
        if (typeof window !== 'undefined') {
            const checkEthereum = () => {
                if (typeof window.ethereum !== 'undefined' && !this.metaMaskReady) {
                    this.metaMaskReady = true;
                    this.setupMetaMask();
                }
            };
            const interval = setInterval(() => {
                if (this.metaMaskReady) {
                    clearInterval(interval);
                    return;
                }
                checkEthereum();
            }, 500);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && !this.metaMaskReady) {
                    checkEthereum();
                }
            });
        }
    }
    
    async waitForMetaMask() {
        return new Promise((resolve) => {
            const maxWaitTime = 10000;
            const checkInterval = 100;
            let elapsed = 0;
            
            const checkMetaMask = () => {
                elapsed += checkInterval;
                if (this.isMetaMaskAvailable()) {
                    this.metaMaskReady = true;
                    this.setupMetaMask();
                    resolve();
                    return;
                }
                if (elapsed >= maxWaitTime) {
                    resolve();
                    return;
                }
                setTimeout(checkMetaMask, checkInterval);
            };
            checkMetaMask();
        });
    }
    
    isMetaMaskAvailable() {
        try {
            if (typeof window.ethereum === 'undefined') return false;
            if (window.ethereum.isMetaMask) return true;
            if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
                return window.ethereum.providers.some(provider => provider.isMetaMask);
            }
            if (window.ethereum && typeof window.ethereum.request === 'function') return true;
            return false;
        } catch {
            return false;
        }
    }
    
    getEthereumProvider() {
        if (!window.ethereum) return null;
        if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
            const metaMaskProvider = window.ethereum.providers.find(provider => provider.isMetaMask);
            if (metaMaskProvider) return metaMaskProvider;
            return window.ethereum.providers[0];
        }
        return window.ethereum;
    }
    
    async tryConnectAnyProvider() {
        if (!window.ethereum) return false;
        try {
            if (typeof window.ethereum.request === 'function') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) return true;
            }
            if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
                for (const provider of window.ethereum.providers) {
                    try {
                        const accounts = await provider.request({ method: 'eth_requestAccounts' });
                        if (accounts && accounts.length > 0) return true;
                    } catch {}
                }
            }
            return false;
        } catch {
            return false;
        }
    }
    
    async showNetworkInfo() {}
    async addHardhatNetwork() {}
    async switchToHardhatNetwork() {}
    showTroubleshooting() {}
    refreshPage() { window.location.reload(); }
    
    async checkAndPromptNetworkSwitch() {
        if (!window.ethereum) return false;
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const targetChainId = '0x7A69';
            if (chainId !== targetChainId) {
                await this.switchToHardhatNetwork();
                return true;
            } else {
                return true;
            }
        } catch {
            return false;
        }
    }
    
    setupEventListeners() {
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => { this.connectWallet(); });
        }
        const refreshBtn = document.getElementById('refresh-metamask');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => { this.refreshMetaMaskDetection(); });
        }
        const disconnectBtn = document.getElementById('disconnect-wallet');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => { this.disconnectWallet(); });
        }
        const debugBtn = document.getElementById('show-debug');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {});
        }
        const createClubForm = document.getElementById('create-club-form');
        if (createClubForm) {
            createClubForm.addEventListener('submit', (e) => { e.preventDefault(); this.createClub(); });
        }
        const finalizeVotingBtn = document.getElementById('finalize-voting-btn');
        if (finalizeVotingBtn) {
            finalizeVotingBtn.addEventListener('click', () => { this.finalizeVoting(); });
        }
        const createPostForm = document.getElementById('create-post-form');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => { e.preventDefault(); this.createPost(); });
        }
        const proposeBookForm = document.getElementById('propose-book-form');
        if (proposeBookForm) {
            proposeBookForm.addEventListener('submit', (e) => { e.preventDefault(); this.proposeBook(); });
        }
    }
    
    async setupMetaMask() {
        try {
            const ethereum = this.getEthereumProvider();
            if (!ethereum) throw new Error('MetaMask non installato');
            await this.checkAndSwitchNetwork(ethereum);
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            this.userAddress = accounts[0];
            this.updateWalletStatus();
            await this.connectContract();
        } catch {}
    }
    
    async checkAndSwitchNetwork(ethereum) {
        try {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            const targetChainId = '0x7A69';
            if (chainId !== targetChainId) {
                try {
                    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChainId }] });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: targetChainId,
                                chainName: 'Hardhat Local',
                                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                                rpcUrls: ['http://127.0.0.1:8545/'],
                                blockExplorerUrls: []
                            }],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
        } catch {}
    }
    
    async connectWallet() {
        try {
            const previousAddress = this.userAddress;
            if (this.metaMaskReady) {
                await this.setupMetaMask();
            } else if (this.isMetaMaskAvailable()) {
                this.metaMaskReady = true;
                await this.setupMetaMask();
            }
            if (previousAddress && this.userAddress && previousAddress.toLowerCase() !== this.userAddress.toLowerCase()) {
                window.location.href = 'index.html';
                return;
            }
        } catch {}
    }
    
    updateWalletStatus() {
        const statusText = document.getElementById('status-text');
        const accountInfo = document.getElementById('account-info');
        const accountAddress = document.getElementById('account-address');
        const navButtons = document.getElementById('nav-buttons');
        const disconnectBtn = document.getElementById('disconnect-wallet');
        
        if (statusText) {
            if (this.userAddress) {
                statusText.textContent = 'Wallet connesso';
            } else {
                statusText.textContent = 'Wallet non connesso';
            }
        }
        if (accountAddress) {
            accountAddress.textContent = this.userAddress || '';
        }
        if (accountInfo) {
            accountInfo.style.display = this.userAddress ? 'block' : 'none';
        }
        if (navButtons) {
            navButtons.style.display = this.userAddress ? 'block' : 'none';
        }
        if (disconnectBtn) {
            disconnectBtn.style.display = this.userAddress ? 'inline-block' : 'none';
        }
    }
    
    async disconnectWallet() {
        try {
            this.userAddress = null;
            this.contract = null;
            this.signer = null;
            this.provider = null;
            this.updateWalletStatus();
        } catch {}
    }
    
    async createClub() {
        if (!this.contract) return;
        const name = document.getElementById('club-name').value;
        const description = document.getElementById('club-description').value;
        if (!name || !description) return;
        try {
            const tx = await this.contract.createClub(name, description);
            await tx.wait();
            document.getElementById('club-name').value = '';
            document.getElementById('club-description').value = '';
            this.loadUserClubs();
        } catch {}
    }
    
    async loadUserClubs() {
        if (!this.contract) return;
        if (!this.userAddress) return;
        try {
            const clubsList = document.getElementById('clubs-list');
            if (!clubsList) return;
            clubsList.innerHTML = '<p>Caricamento club...</p>';
            const clubs = await this.getUserClubs();
            this.displayClubs(clubs);
        } catch {}
    }
     
    async getUserClubs() {
        if (!this.contract || !this.userAddress) return [];
        try {
            const userClubIds = await this.contract.getUserClubs(this.userAddress);
            const userClubs = [];
            for (const clubId of userClubIds) {
                try {
                    const clubDetails = await this.contract.getClub(clubId);
                    userClubs.push({
                        id: clubId,
                        name: clubDetails.name,
                        description: clubDetails.description,
                        creator: clubDetails.creator,
                        memberCount: clubDetails.memberCount,
                        currentBook: clubDetails.currentBook,
                        currentAuthor: clubDetails.currentAuthor
                    });
                } catch {}
            }
            return userClubs;
        } catch {
            return [];
        }
    }
    
    displayClubs(clubs) {
        const clubsList = document.getElementById('clubs-list');
        if (!clubsList) return;
        if (clubs.length === 0) {
            clubsList.innerHTML = '<p class="text-muted">Non sei ancora membro di nessun club. Crea un nuovo club o unisciti a uno esistente!</p>';
            return;
        }
        let html = '<div class="row">';
        clubs.forEach(club => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="club-card" onclick="app.navigateToClub(${club.id})">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-2">${club.name}</h6>
                                <p class="text-muted mb-2">${club.description}</p>
                                <small class="text-muted">
                                    <strong>Membri:</strong> ${club.memberCount} | 
                                    <strong>Creatore:</strong> ${club.creator === this.userAddress ? 'Tu' : club.creator.slice(0, 6) + '...'}
                                </small>
                            </div>
                            <span class="badge bg-primary">${club.id}</span>
                        </div>
                        ${club.currentBook ? `<div class="mt-2"><small class="text-success">${club.currentBook}${club.currentAuthor ? `, ${club.currentAuthor}` : ''}</small></div>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        clubsList.innerHTML = html;
    }

    async loadAllClubs() {
        const allClubsList = document.getElementById('all-clubs-list');
        if (!allClubsList) return;
        const reader = this.contract || this.getReadOnlyContract();
        if (!reader) return;
        try {
            allClubsList.innerHTML = '<p>Caricamento club...</p>';
            const total = await reader.nextClubId();
            const totalNum = Number(total);
            const clubs = [];
            for (let idx = 0; idx < Math.max(totalNum - 1, 0); idx++) {
                try {
                    const clubDetails = await reader.getClub(idx);
                    clubs.push({
                        id: idx,
                        name: clubDetails.name,
                        description: clubDetails.description,
                        creator: clubDetails.creator,
                        memberCount: clubDetails.memberCount,
                        currentBook: clubDetails.currentBook,
                        currentAuthor: clubDetails.currentAuthor
                    });
                } catch {}
            }
            let filtered = clubs;
            if (this.userAddress && this.contract) {
                try {
                    const myIds = await this.contract.getUserClubs(this.userAddress);
                    const mySet = new Set(myIds.map(id => Number(id)));
                    filtered = clubs.filter(c => !mySet.has(Number(c.id)));
                } catch {}
            }
            this.displayAllClubs(filtered);
        } catch {}
    }

    displayAllClubs(clubs) {
        const allClubsList = document.getElementById('all-clubs-list');
        if (!allClubsList) return;
        if (!clubs || clubs.length === 0) {
            allClubsList.innerHTML = '<p class="text-muted">Nessun club disponibile. Crea il primo!</p>';
            return;
        }
        let html = '<div class="row">';
        clubs.forEach(club => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="club-card">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-2">${club.name}</h6>
                                <p class="text-muted mb-2">${club.description}</p>
                                <small class="text-muted"><strong>Membri:</strong> ${club.memberCount}</small>
                            </div>
                            <span class="badge bg-primary">${club.id}</span>
                        </div>
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-success btn-sm" onclick="app.joinClub(${club.id})">Unisciti</button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        allClubsList.innerHTML = html;
    }

    async joinClub(clubId) {
        if (!this.contract) return;
        try {
            const tx = await this.contract.joinClub(clubId);
            await tx.wait();
            await this.loadUserClubs();
            await this.loadAllClubs();
        } catch {}
    }
    
    navigateToClub(clubId) {
        window.location.href = `club.html?clubId=${clubId}`;
    }
    
    async selectClub(clubId) {
        this.currentClub = clubId;
        await this.loadClubDetails(clubId);
    }
    
    async loadClubDetails(clubId) {
        try {
            const club = await this.contract.getClub(clubId);
            const members = await this.contract.getClubMembers(clubId);
            const proposals = await this.contract.getClubProposals(clubId);
            const posts = await this.contract.getClubPosts(clubId);
            this.displayClubDetails(club, members, proposals, posts);
        } catch {}
    }
    
    displayClubDetails(club, members, proposals, posts) {
        const clubDetails = document.getElementById('club-details');
        const clubDetailsTitle = document.getElementById('club-details-title');
        if (!clubDetails || !clubDetailsTitle) return;
        clubDetails.style.display = 'block';
        clubDetailsTitle.innerHTML = `Club: <span id="current-club-name">${club.name}</span>`;
        const clubInfo = document.createElement('div');
        clubInfo.className = 'alert alert-info mb-3';
        clubInfo.innerHTML = `
            <strong>📋 Informazioni Club:</strong><br>
            <small>
                <strong>Descrizione:</strong> ${club.description}<br>
                <strong>Membri:</strong> ${members.length}<br>
                <strong>Creatore:</strong> ${club.creator === this.userAddress ? 'Tu' : club.creator.slice(0, 6) + '...'}
            </small>
        `;
        const existingInfo = clubDetails.querySelector('.alert-info');
        if (existingInfo) existingInfo.remove();
        const cardBody = clubDetails.querySelector('.card-body');
        if (cardBody) {
            cardBody.insertBefore(clubInfo, cardBody.firstChild);
        }
        const currentBookText = document.getElementById('current-book-text');
        if (currentBookText) {
            if (club.currentBook) {
                const bookDisplay = club.currentAuthor ? 
                    `${club.currentBook}, ${club.currentAuthor}` : 
                    club.currentBook;
                currentBookText.textContent = ` ${bookDisplay}`;
            } else {
                currentBookText.textContent = 'Nessun libro in lettura';
            }
        }
        this.displayBookProposals(proposals);
        this.displayPosts(posts);
    }
    
    async refreshMetaMaskDetection() {
        if (this.isMetaMaskAvailable()) {
            this.metaMaskReady = true;
            await this.setupMetaMask();
        }
    }
    
    displayBookProposals(proposals) {
        const proposalsDiv = document.getElementById('book-proposals');
        if (proposals.length === 0) {
            proposalsDiv.innerHTML = '<p>Nessuna proposta di libro al momento</p>';
            return;
        }
        let html = '';
        proposals.forEach((proposal, index) => {
            if (proposal.isActive) {
                html += `
                    <div class="proposal-card">
                        <h6>${proposal.title}</h6>
                        <p class="text-muted">di ${proposal.author}</p>
                        <p>Voti: ${proposal.votes}</p>
                        <button class="vote-btn" onclick="app.voteForBook(${index})">
                            Vota
                        </button>
                    </div>
                `;
            }
        });
        proposalsDiv.innerHTML = html;
    }
    
    displayPosts(posts) {
        const postsDiv = document.getElementById('posts-list');
        if (!posts || posts.length === 0) {
            postsDiv.innerHTML = '<p>Nessun post al momento</p>';
            return;
        }
        let html = '';
        posts.forEach(post => {
            html += `
                <div class="post-card mb-3 p-3 border rounded">
                    <h6>${post.title}</h6>
                    <p>${post.content}</p>
                    <small class="text-muted">
                        di ${post.author.slice(0, 6)}... - ${new Date(Number(post.timestamp) * 1000).toLocaleDateString()}
                    </small>
                </div>
            `;
        });
        postsDiv.innerHTML = html;
    }

    async finalizeVoting() {
        if (!this.currentClub) return;
        try {
            const tx = await this.contract.finalizeVoting(this.currentClub);
            await tx.wait();
            await this.loadClubDetails(this.currentClub);
        } catch {}
    }
    
    async createPost() {
        if (!this.currentClub) return;
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        if (!title || !content) return;
        try {
            const tx = await this.contract.createPost(this.currentClub, title, content);
            await tx.wait();
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            await this.loadClubDetails(this.currentClub);
        } catch {}
    }
    
    async proposeBook() {
        if (!this.currentClub) return;
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        if (!title || !author) return;
        try {
            const tx = await this.contract.proposeBook(this.currentClub, title, author);
            await tx.wait();
            document.getElementById('book-title').value = '';
            document.getElementById('book-author').value = '';
            await this.loadClubDetails(this.currentClub);
        } catch {}
    }
    
    async voteForBook(proposalIndex) {
        if (!this.currentClub) return;
        try {
            const tx = await this.contract.voteForBook(this.currentClub, proposalIndex);
            await tx.wait();
            await this.loadClubDetails(this.currentClub);
        } catch {}
    }
    
    async checkHardhatNode() {
        try {
            const response = await fetch('http://127.0.0.1:8545', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                })
            });
            if (response.ok) {
                await this.checkContractDeployment();
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }
    
    async checkContractDeployment() {
        try {
            const response = await fetch('http://127.0.0.1:8545', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getCode',
                    params: [this.contractAddress, 'latest'],
                    id: 2
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.result && data.result !== '0x') {
                    return true;
                }
            }
        } catch {}
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BookChainApp();
    const params = new URLSearchParams(window.location.search);
    const clubIdParam = params.get('clubId');
    const clubDetailsCard = document.getElementById('club-details');
    if (clubDetailsCard && clubIdParam) {
        const parsedId = Number(clubIdParam);
        if (!Number.isNaN(parsedId)) {
            app.currentClub = parsedId;
            const tryLoad = async () => {
                if (app.contract) {
                    await app.loadClubDetails(parsedId);
                } else {
                    setTimeout(tryLoad, 200);
                }
            };
            tryLoad();
        }
    }
});
