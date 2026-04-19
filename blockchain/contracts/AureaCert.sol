// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AureaCert
 * @author Elena - TFG DAW
 * @notice Smart contract para emitir y verificar certificados de autenticidad
 *         de productos de moda vendidos en la plataforma Aurea.
 * @dev Cada certificado queda registrado de forma inmutable en la blockchain.
 *      Solo la dirección del `issuer` (backend de Aurea) puede emitir nuevos
 *      certificados. Cualquiera puede verificar su existencia y contenido.
 */
contract AureaCert {
    // ---------------------------------------------------------------------
    // Estructuras de datos
    // ---------------------------------------------------------------------

    struct Certificate {
        uint256 id;             // Identificador único del certificado
        string productId;       // ID del producto en la BD de Aurea
        string productName;     // Nombre del producto (ej. "Chaqueta de cuero")
        string serialNumber;    // Número de serie único de la prenda
        address owner;          // Dirección (o hash identificativo) del comprador
        uint256 issuedAt;       // Timestamp de emisión
        string metadataURI;     // URI opcional (IPFS) con metadatos extendidos
        bool exists;            // Flag para comprobar la existencia
    }

    // ---------------------------------------------------------------------
    // Variables de estado
    // ---------------------------------------------------------------------

    /// @notice Dirección autorizada para emitir certificados (backend).
    address public issuer;

    /// @notice Contador incremental de certificados emitidos.
    uint256 public totalCertificates;

    /// @notice Mapeo id -> certificado.
    mapping(uint256 => Certificate) private _certificates;

    /// @notice Mapeo serial -> id del certificado (para lookup rápido).
    mapping(string => uint256) private _serialToId;

    // ---------------------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------------------

    event CertificateIssued(
        uint256 indexed id,
        string indexed productId,
        string serialNumber,
        address indexed owner,
        uint256 issuedAt
    );

    event IssuerTransferred(address indexed previousIssuer, address indexed newIssuer);

    // ---------------------------------------------------------------------
    // Modificadores
    // ---------------------------------------------------------------------

    modifier onlyIssuer() {
        require(msg.sender == issuer, "AureaCert: caller is not the issuer");
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    /**
     * @notice Inicializa el contrato fijando al emisor autorizado.
     * @param _issuer Dirección del backend de Aurea autorizada a emitir.
     */
    constructor(address _issuer) {
        require(_issuer != address(0), "AureaCert: issuer cannot be zero");
        issuer = _issuer;
        emit IssuerTransferred(address(0), _issuer);
    }

    // ---------------------------------------------------------------------
    // Funciones externas
    // ---------------------------------------------------------------------

    /**
     * @notice Emite un nuevo certificado de autenticidad.
     * @dev Solo puede llamarla la dirección `issuer`.
     * @param productId Identificador del producto en la plataforma.
     * @param productName Nombre legible del producto.
     * @param serialNumber Número de serie único (no puede repetirse).
     * @param owner Dirección del comprador (o hash representativo).
     * @param metadataURI URI opcional con metadatos extendidos (ej. IPFS).
     * @return id Identificador del certificado recién creado.
     */
    function issueCertificate(
        string calldata productId,
        string calldata productName,
        string calldata serialNumber,
        address owner,
        string calldata metadataURI
    ) external onlyIssuer returns (uint256 id) {
        require(bytes(productId).length > 0, "AureaCert: productId required");
        require(bytes(serialNumber).length > 0, "AureaCert: serialNumber required");
        require(owner != address(0), "AureaCert: owner cannot be zero");
        require(_serialToId[serialNumber] == 0, "AureaCert: serial already issued");

        totalCertificates += 1;
        id = totalCertificates;

        _certificates[id] = Certificate({
            id: id,
            productId: productId,
            productName: productName,
            serialNumber: serialNumber,
            owner: owner,
            issuedAt: block.timestamp,
            metadataURI: metadataURI,
            exists: true
        });

        _serialToId[serialNumber] = id;

        emit CertificateIssued(id, productId, serialNumber, owner, block.timestamp);
    }

    /**
     * @notice Transfiere el rol de emisor a otra dirección.
     * @param newIssuer Nueva dirección autorizada.
     */
    function transferIssuer(address newIssuer) external onlyIssuer {
        require(newIssuer != address(0), "AureaCert: newIssuer cannot be zero");
        emit IssuerTransferred(issuer, newIssuer);
        issuer = newIssuer;
    }

    // ---------------------------------------------------------------------
    // Funciones de consulta (view)
    // ---------------------------------------------------------------------

    /**
     * @notice Devuelve un certificado por su id.
     * @param id Identificador del certificado.
     */
    function getCertificate(uint256 id) external view returns (Certificate memory) {
        require(_certificates[id].exists, "AureaCert: certificate not found");
        return _certificates[id];
    }

    /**
     * @notice Devuelve un certificado buscando por número de serie.
     * @param serialNumber Número de serie del producto.
     */
    function getCertificateBySerial(string calldata serialNumber)
        external
        view
        returns (Certificate memory)
    {
        uint256 id = _serialToId[serialNumber];
        require(id != 0, "AureaCert: serial not found");
        return _certificates[id];
    }

    /**
     * @notice Comprueba si existe un certificado para un número de serie dado.
     */
    function isCertified(string calldata serialNumber) external view returns (bool) {
        return _serialToId[serialNumber] != 0;
    }
}
